import { QueueNode } from './QueueNode';

export class Queue<T> {
  #size = 0;
  #head: QueueNode<T> | null = null;
  #tail: QueueNode<T> | null = null;

  constructor(initialValues?: Iterable<T>) {
    if (initialValues) {
      this.push(...initialValues);
    }
  }

  get size(): number {
    if (!this.#head || !this.#tail) {
      return 0;
    }

    return this.#size;
  }

  push(...values: T[]): number {
    for (const value of values) {
      this.#pushOne(value);
    }

    return this.#size;
  }

  shift(): T | undefined {
    const headNode = this.#head;

    this.#head = headNode?.nextNode ?? null;

    if (!this.#head) {
      this.#tail = null;
    }

    this.#size = Math.max(0, this.#size - 1);

    return headNode?.value;
  }

  dissolve(): T | undefined {
    let lastValue: T | undefined;

    while (this.size > 0) {
      lastValue = this.shift();
    }

    return lastValue;
  }

  #pushOne(value: T): void {
    const node = new QueueNode(value);

    ++this.#size;

    if (this.#tail) {
      this.#tail = this.#tail.append(node);
    } else {
      this.#head = this.#tail = node;
    }
  }

}
