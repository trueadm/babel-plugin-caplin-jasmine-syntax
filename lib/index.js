"use strict";

const queueTypes = {
	WAITS: 0,
	RUNS: 1,
	WAITS_FOR: 2
};

function traverseAndFindAsync(t, node, asyncQueue) {
	if (node.type === 'FunctionExpression') {
		const body = node.body.body;
		let length = body.length;

		for (let i = 0; i < length; i++) {
			const decrement = traverseAndFindAsync(t, body[i], asyncQueue);

			// as we remove code from the body if it's async, we need to handle the array decrementing
			if (decrement) {
				i--;
				length--;
			}
		}
	} else if (node.type === 'ExpressionStatement') {
		const expression = node.expression;
		const callee = expression.callee;

		if (callee.name === 'waits') {
			asyncQueue.push({
				type: queueTypes.WAITS,
				value: expression.arguments[0].value
			});
			node._paths[0].remove();
			return true;
		} else if (callee.name === 'runs') {
			asyncQueue.push({
				type: queueTypes.RUNS,
				func: expression.arguments[0].body.body
			});
			node._paths[0].remove();
			return true;
		} else if (callee.name === 'waitsFor') {
			asyncQueue.push({
				type: queueTypes.WAITS_FOR,
				func: expression.arguments[0],
				expected: expression.arguments[1].value,
				value: expression.arguments[2].value
			});
			node._paths[0].remove();
			return true;
		}
	}
}

function handleTestBlocks(t, path) {
	const node = path.node;
	const callee = node.callee;
	let asyncFuncCounter = 0;

	if (callee.name === 'it' || callee.name === 'beforeEach' || callee.name === 'afterEach') {
		const args = node.arguments;

		if (args.length === 2) {
			const asyncQueue = [];
			const funcBlock = args[1];

			traverseAndFindAsync(t, funcBlock, asyncQueue);
			if (asyncQueue.length > 0) {
				funcBlock.params.push(t.identifier('done'));
				let body = funcBlock.body.body;

				for (let i = 0; i < asyncQueue.length; i++) {
					const item = asyncQueue[i];

					if (item.type === queueTypes.WAITS) {
						const nextBody = [];

						body.push(t.ExpressionStatement(
							t.CallExpression(t.identifier('setTimeout'), [
								t.FunctionExpression(null, [], t.BlockStatement(nextBody))
							, t.NumericLiteral(item.value)]))
						);
						body = nextBody;
					} else if (item.type === queueTypes.RUNS) {
						item.func.forEach(_item => {
							body.push(_item);
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

	return {
		visitor: {
			CallExpression: function enter(path, scope) {
				handleTestBlocks(t, path);
			}
		}
	}
};