import { describe, expect, test } from 'bun:test';
import { QueueNode } from './QueueNode';

describe('QueueNode', () => {
  test('create with value', () => {
    const node = new QueueNode('a');

    expect(node.value).toBe('a');
  });

  test('append node and return it', () => {
    const nodeA = new QueueNode('a');
    const nodeB = new QueueNode('b');

    expect(nodeA.append(nodeB)).toBe(nodeB);
    expect(nodeA.nextNode).toBe(nodeB);
  });
});
