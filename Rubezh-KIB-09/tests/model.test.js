const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../model.js');

test('Each company has a completed 18-control example', () => {
  assert.equal(m.controls.length, 3 * m.sections.length);
  for (const profile of m.profiles) {
    assert.equal(profile.demo.length, 18);
    assert.ok(m.complete({answers: profile.demo}));
  }
});
test('Unanswered and unknown have distinct completion states', () => {
  assert.equal(m.complete(m.fresh()), false);
  assert.equal(m.complete({answers: Array(18).fill(3)}), true);
  assert.equal(m.score(Array(18).fill(3)), 0);
});
test('Score boundaries and partial answers', () => {
  for (const [answer, percent] of [[0,0],[1,50],[2,100]]) {
    assert.equal(m.score(Array(18).fill(answer)), percent);
  }
});
test('A planned restore increases only the projection', () => {
  const state = {...m.fresh(), answers:[...m.profiles[0].demo], selected:[2]};
  assert.equal(m.score(state.answers),56);
  assert.equal(m.forecast(state),61);
  assert.equal(m.effort(state),3);
  assert.equal(state.answers[2],0);
});
test('Corrupted storage cannot add control IDs, invalid answers or excess effort', () => {
  const raw = {answers:Array(18).fill(0), budget:3, selected:[2,2,23,-1,'alert',1]};
  assert.deepEqual(m.clean(raw).selected,[2]);
  assert.deepEqual(m.clean({answers:['<img>'],profile:'<html>'}),m.fresh());
});
test('Fulfilled and unanswered measures stay out of the gap list', () => {
  const state=m.fresh();
  state.answers.splice(0,4,2,1,0,3);
  assert.deepEqual(m.gaps(state),[3,2,1]);
});
