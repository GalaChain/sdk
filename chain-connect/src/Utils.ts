type EIP712Types = Record<string, Array<{ name: string; type: string }>>;
type EIP712Value = Record<string, unknown>;

export function generateEIP712Types<T>(typeName: string, params: T): EIP712Types {
  const types: EIP712Types = {};
  types[typeName] = [];

  function addField(name: string, fieldValue: unknown, parentTypeName: string, onlyGetType = false) {
    if (Array.isArray(fieldValue)) {
      //Take the type of the first element
      addField(name, fieldValue[0], parentTypeName, true);
      if (!onlyGetType) types[parentTypeName].push({ name, type: name + "[]" });
    } else if (typeof fieldValue === "object" && fieldValue !== null) {
      if (types[name]) {
        throw new Error("Name collisions not yet supported");
      }
      types[name] = [];
      Object.entries(fieldValue).forEach(([key, value]) => {
        addField(key, value, name);
      });
      if (!onlyGetType) types[parentTypeName].push({ name, type: name });
    } else {
      let eipType: string;
      switch (typeof fieldValue) {
        case "string":
          eipType = "string";
          break;
        case "number":
          eipType = "uint256";
          break;
        case "boolean":
          eipType = "bool";
          break;
        default:
          eipType = "string"; // Default to string for any unknown type
      }
      if (!onlyGetType) types[parentTypeName].push({ name, type: eipType });
    }
  }

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    addField(key, value, typeName);
  });

  return types;
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function generateEIP712Value<T>(params: T): EIP712Value {
  const value: EIP712Value = {};

  function addField(name: string, field: unknown) {
    if (Array.isArray(field) || (typeof field === "object" && field !== null)) {
      Object.entries(field).forEach(([key, val]) => {
        addField(`${name}${capitalizeFirstLetter(key)}`, val);
      });
    } else {
      value[name] = field;
    }
  }

  Object.entries(params as Record<string, unknown>).forEach(([key, field]) => {
    addField(key, field);
  });

  return value;
}
