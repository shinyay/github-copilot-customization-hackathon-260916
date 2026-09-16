export function parseNamedArguments(argv, { booleanNames = [] } = {}) {
  const result = {};
  const booleans = new Set(booleanNames);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }
    const equalsIndex = token.indexOf("=");
    const name =
      equalsIndex === -1 ? token.slice(2) : token.slice(2, equalsIndex);
    if (Object.hasOwn(result, name)) {
      throw new Error(`Duplicate argument: --${name}`);
    }
    if (booleans.has(name)) {
      if (equalsIndex !== -1) {
        throw new Error(`Boolean argument must not have a value: --${name}`);
      }
      result[name] = true;
      continue;
    }
    if (equalsIndex !== -1) {
      const inlineValue = token.slice(equalsIndex + 1);
      if (inlineValue.length === 0) {
        throw new Error(`Missing value for --${name}`);
      }
      result[name] = inlineValue;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}`);
    }
    result[name] = value;
    index += 1;
  }

  return result;
}

export function requireArguments(args, names) {
  for (const name of names) {
    if (!args[name]) {
      throw new Error(`Missing required argument: --${name}`);
    }
  }
}

export function assertOnlyArguments(args, names) {
  const allowed = new Set(names);
  for (const name of Object.keys(args)) {
    if (!allowed.has(name)) {
      throw new Error(`Unknown argument: --${name}`);
    }
  }
}
