export class ChattyError {
  public readonly sourceError: unknown;
  public readonly isUnexpected: boolean;
  public source?: string;

  constructor(source: unknown, options?: { isUnexpected: boolean }) {
    this.sourceError = source;
    this.isUnexpected =
      options?.isUnexpected !== undefined ? options.isUnexpected : true;
  }
}
