export async function add(resolver: any, prop: any, ctx: any) {
  // TODO: validate prop;
  try {
    const result = await resolver.add(prop, ctx);
    return [null, result];
  } catch (error) {
    return [
      {
        code: 'RESOLVER_ADD_ERROR',
        message: 'Error adding property',
        originalError: error,
        context: {
          ctx,
        },
      },
      null,
    ];
  }
}
