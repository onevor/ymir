export async function add(resolver: any, prop: any, ctx: any) {
  // TODO: validate prop;
  // TODO: validate that plugin has implemented method;
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

export async function remove(resolver: any, prop: any, ctx: any) {
  // TODO: validate prop;
  // TODO: validate that plugin has implemented method;
  try {
    const result = await resolver.remove(prop, ctx);
    return [null, result];
  } catch (error) {
    return [
      {
        code: 'RESOLVER_REMOVE_ERROR',
        message: 'Error removing property',
        originalError: error,
        context: {
          ctx,
        },
      },
      null,
    ];
  }
}
