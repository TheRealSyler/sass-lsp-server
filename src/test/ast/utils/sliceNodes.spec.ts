import { LineNode } from '../../../abstractSyntaxTree/nodes';
import { sliceNodes } from '../../../abstractSyntaxTree/utils';

test('AST: SliceNodes', async () => {
  const nodes: LineNode[] = [
    {
      line: 0,
      level: 0,
      type: 'selector',
      name: [{ type: 'literalValue', value: '.class' }],
      body: [
        {
          line: 1,
          level: 1,
          name: [{ type: 'literalValue', value: 'margin' }],
          type: 'property',
          value: [{ type: 'literalValue', value: '20px' }],
        },
        {
          line: 2,
          level: 1,
          body: [
            {
              level: 2,
              line: 3,
              type: 'property',
              name: [{ type: 'literalValue', value: 'color' }],
              value: [{ type: 'literalValue', value: 'red' }],
            },
          ],
          name: [{ type: 'literalValue', value: '&:hover' }],
          type: 'selector',
        },
      ],
    },
  ];

  const emptyScope = {
    imports: [],
    selectors: [],
    variables: [],
  };

  const expectedSliceZero: ReturnType<typeof sliceNodes> = {
    nodes: [
      {
        line: 0,
        level: 0,
        type: 'selector',
        name: [{ type: 'literalValue', value: '.class' }],
        body: [],
      },
    ],
    scope: emptyScope,
  };

  const expectedSliceOne: ReturnType<typeof sliceNodes> = {
    nodes: [
      {
        line: 0,
        level: 0,
        type: 'selector',
        name: [{ type: 'literalValue', value: '.class' }],
        body: [
          {
            line: 1,
            level: 1,
            name: [{ type: 'literalValue', value: 'margin' }],
            type: 'property',
            value: [{ type: 'literalValue', value: '20px' }],
          },
        ],
      },
    ],
    scope: emptyScope,
  };
  const expectedSliceTwo: ReturnType<typeof sliceNodes> = {
    nodes: [
      {
        line: 0,
        level: 0,
        type: 'selector',
        name: [{ type: 'literalValue', value: '.class' }],
        body: [
          {
            line: 1,
            level: 1,
            name: [{ type: 'literalValue', value: 'margin' }],
            type: 'property',
            value: [{ type: 'literalValue', value: '20px' }],
          },
          {
            line: 2,
            level: 1,
            body: [],
            name: [{ type: 'literalValue', value: '&:hover' }],
            type: 'selector',
          },
        ],
      },
    ],
    scope: emptyScope,
  };

  const expectedSliceThreeAndFour: ReturnType<typeof sliceNodes> = {
    nodes: nodes,
    scope: emptyScope,
  };
  expect(sliceNodes(JSON.parse(JSON.stringify(nodes)), 0)).toStrictEqual(expectedSliceZero);

  expect(sliceNodes(JSON.parse(JSON.stringify(nodes)), 1)).toStrictEqual(expectedSliceOne);

  expect(sliceNodes(JSON.parse(JSON.stringify(nodes)), 2)).toStrictEqual(expectedSliceTwo);

  expect(sliceNodes(JSON.parse(JSON.stringify(nodes)), 3)).toStrictEqual(expectedSliceThreeAndFour);

  expect(sliceNodes(JSON.parse(JSON.stringify(nodes)), 4)).toStrictEqual(expectedSliceThreeAndFour);
});
