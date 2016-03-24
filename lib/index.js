"use strict";

const queueTypes = {
	WAITS: 0,
	RUNS: 1,
	WAITS_FOR: 2
};

function traverseAndFindAsync(t, path, asyncQueue) {
	const node = path.node;

	if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
		const body = path.get('body').get('body');
		let length = body.length;

		for (let i = 0; i < length; i++) {
			traverseAndFindAsync(t, body[i], asyncQueue);
		}
	} else if (node.type === 'ExpressionStatement') {
		const expression = node.expression;
		const expressionPath = path.get('expression');
		const callee = expression.callee;

		if (expression.arguments) {
			if (callee.name === 'waits') {
				asyncQueue.push({
					type: queueTypes.WAITS,
					value: expression.arguments[0]
				});
				expressionPath.remove();
			} else if (callee.name === 'runs') {
				const runBody = expressionPath.get('arguments')[0].get('body').get('body');

				runBody.forEach(body => traverseAndFindAsync(t, body, asyncQueue));
				asyncQueue.push({
					type: queueTypes.RUNS,
					func: runBody
				});
				expressionPath.remove();
			} else if (callee.name === 'waitsFor') {
				asyncQueue.push({
					type: queueTypes.WAITS_FOR,
					func: expression.arguments[0],
					expected: expression.arguments[1].value,
					value: expression.arguments[2].value
				});
				expressionPath.remove();
			}
		}
	}
}

function handleTestBlocks(t, path) {
	const node = path.node;
	const callee = node.callee;
	let asyncFuncCounter = 0;

	if (callee.name === 'it' || callee.name === 'beforeEach' || callee.name === 'afterEach') {
		const args = path.get('arguments');

		if (args.length > 0) {
			const asyncQueue = [];
			const funcBlock = args.length === 2 ? args[1] : args[0];

			traverseAndFindAsync(t, funcBlock, asyncQueue);
			if (asyncQueue.length > 0) {
				const funcBlockNode = funcBlock.node;
				funcBlockNode.params.push(t.identifier('done'));

				let body = funcBlockNode.body.body;

				for (let i = 0; i < asyncQueue.length; i++) {
					const item = asyncQueue[i];

					if (item.type === queueTypes.WAITS) {
						const nextBody = [];

						body.push(t.ExpressionStatement(
							t.CallExpression(t.identifier('setTimeout'), [
								t.FunctionExpression(null, [], t.BlockStatement(nextBody))
							, item.value]))
						);
						body = nextBody;
					} else if (item.type === queueTypes.RUNS) {
						item.func.forEach(_item => {
							body.push(_item.node);
						});
					} else if (item.type === queueTypes.WAITS_FOR) {
						const funcName1 = 'waitsForCriteria$' + (asyncFuncCounter++);
						const funcName2 = 'waitsForPoll$' + (asyncFuncCounter++);
						const timeoutName = 'waitsForTimeout$' + (asyncFuncCounter++);
						const nextBody = [
							t.ExpressionStatement(t.callExpression(
								t.identifier('clearTimeout'), [t.identifier(timeoutName)]
							))
						];

						body.push(t.variableDeclaration('var',[
							t.variableDeclarator(t.identifier(timeoutName),
							t.callExpression(
								t.identifier('setTimeout'), [
									t.FunctionExpression(null, [], t.BlockStatement([
										t.throwStatement(
											t.identifier(`new Error('waitsFor timed out: ${ item.expected }')`)
										)
									]))
								, t.NumericLiteral(item.value)]
							))
						]));

						item.func.id = t.identifier(funcName1);

						body.push(item.func);
						body.push(t.FunctionExpression(t.identifier(funcName2), [], t.BlockStatement([
							t.ifStatement(
								t.CallExpression(t.identifier(funcName1), []),
								t.BlockStatement(nextBody),
								t.BlockStatement([
									t.ExpressionStatement(t.CallExpression(t.identifier('setTimeout'), [
										t.identifier(funcName2),
										t.NumericLiteral(10)
									]))
								])
							)
						])));
						body.push(t.ExpressionStatement(
							t.CallExpression(t.identifier('setTimeout'), [
								t.identifier(funcName2),
								t.NumericLiteral(10)
							]))
						);
						body = nextBody;
					}
				}
				body.push(t.ExpressionStatement(
					t.CallExpression(t.identifier('done'), [])
				));
			}
		}
	}
}

module.exports = function(options) {
	var t = options.types;
	let compileAll = false;

	return {
		visitor: {
			CallExpression: function enter(path) {
				handleTestBlocks(t, path);
			},
			FunctionDeclaration: function enter(path) {
				//debugger;
			},
			Program: function (body, directives) {
				const comments = body.container.comments;

				if (comments && comments.length > 0) {
					for (let i = 0; i < comments.length; i++) {
						if (comments[i].value.indexOf('compile-jasmine') !== -1) {
							compileAll = true;
						}
					}
				}
			}
		}
	}
};