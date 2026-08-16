const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

const { _test } = require('./search');

const targetBaseZion = {
  player: 'Zion Williamson',
  year: '2019',
  set: 'Prizm',
  cardNumber: '248',
  parallel: '',
  serialTo: null,
  isAutograph: false,
  rawOnly: true
};

const disallowedParallelTitles = [
  '2019 Panini Prizm Zion Williamson #248 Silver RC',
  '2019 Panini Prizm Zion Williamson #248 Green Prizm RC',
  '2019 Panini Prizm Zion Williamson #248 Pink Cracked Ice RC',
  '2019 Panini Prizm Zion Williamson #248 Red/White/Blue RC',
  '2019 Panini Prizm Zion Williamson #248 Fast Break Prizm RC',
  '2019 Panini Prizm Zion Williamson #248 Hyper Prizm RC'
];

for (const title of disallowedParallelTitles) {
  test(`base target rejects parallel treatment: ${title}`, () => {
    const match = _test.scoreExactMatch(
      { title, condition: 'Ungraded' },
      targetBaseZion
    );

    assert.notEqual(
      match.status,
      'accepted'
    );
  });
}

test('base target rejects unexpected autograph', () => {
  const match = _test.scoreExactMatch(
    {
      title:
        '2019 Panini Prizm Zion Williamson #248 Base Auto RC',
      condition: 'Ungraded'
    },
    targetBaseZion
  );

  assert.equal(
    match.status,
    'rejected'
  );
  assert.ok(
    match.reasons.includes(
      'unexpected_autograph'
    )
  );
});
