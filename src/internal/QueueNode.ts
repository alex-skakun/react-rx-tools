export class QueueNode<T> {
  readonly #value: T;
  #nextNode: QueueNode<T> | null = null;

  constructor(value: T) {
    this.#value = value;
  }

  get value(): T {
    return this.#value;
  }

  get nextNode(): QueueNode<T> | null {
    return this.#nextNode;
  }

  append(node: QueueNode<T>): QueueNode<T> {
    this.#nextNode = node;

    return this.#nextNode;
  }
}
