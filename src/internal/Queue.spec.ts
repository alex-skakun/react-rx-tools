import { describe, expect, test } from 'bun:test';
import { Queue } from './Queue';

describe('Queue', () => {
  describe('constructor', () => {
    test('create empty queue', () => {
      const queue = new Queue();

      expect(queue instanceof Queue).toBeTrue();
      expect(queue.size).toBe(0);
    });

    test('create queue from iterable', () => {
      const queue1 = new Queue([1, 2, 3]);
      const queue2 = new Queue('abcde');

      expect(queue1.size).toBe(3);
      expect(queue2.size).toBe(5);
    });
  });

  describe('pushing', () => {
    test('increment size for any new node', () => {
      const queue = new Queue();

      expect(queue.push(1)).toBe(1);
      expect(queue.push(2, 3)).toBe(3);
      expect(queue.push()).toBe(3);
    });
  });

  describe('shifting', () => {
    test('return undefined for empty queue', () => {
      const queue = new Queue();

      expect(queue.shift()).toBeUndefined();
    });

    test('shift values one by one', () => {
      const queue = new Queue([1, 2, 3]);

      expect(queue.size).toBe(3);
      expect(queue.shift()).toBe(1);
      expect(queue.size).toBe(2);
      expect(queue.shift()).toBe(2);
      expect(queue.size).toBe(1);
      expect(queue.shift()).toBe(3);
      expect(queue.size).toBe(0);
      expect(queue.shift()).toBeUndefined();
    });

    test('empty queue and return last', () => {
      const queue = new Queue([1, 2, 3]);

      expect(queue.size).toBe(3);
      expect(queue.dissolve()).toBe(3);
      expect(queue.size).toBe(0);
      expect(queue.dissolve()).toBeUndefined();
    });
  });
});
