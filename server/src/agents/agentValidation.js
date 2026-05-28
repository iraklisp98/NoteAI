export class AgentOutputValidationError extends Error {
  constructor(agentName, errors) {
    super(`${agentName} output was invalid: ${errors.join("; ")}`);
    this.name = "AgentOutputValidationError";
    this.agentName = agentName;
    this.errors = errors;
  }
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function requireObject(value, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  return true;
}

export function requireString(value, path, errors) {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string`);
  }
}

export function requireArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }

  return true;
}

export function requireStringArray(value, path, errors) {
  if (!requireArray(value, path, errors)) {
    return;
  }

  value.forEach((item, index) => requireString(item, `${path}[${index}]`, errors));
}

export function requireObjectArray(value, fields, path, errors) {
  if (!requireArray(value, path, errors)) {
    return;
  }

  value.forEach((item, index) => {
    if (!requireObject(item, `${path}[${index}]`, errors)) {
      return;
    }

    fields.forEach((field) => requireString(item[field], `${path}[${index}].${field}`, errors));
  });
}

export function assertValidAgentOutput(agentName, errors) {
  if (errors.length > 0) {
    throw new AgentOutputValidationError(agentName, errors);
  }
}
