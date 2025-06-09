// src/utils/customImmutableUtils.js

const IMMUTABLE_MARKER = Symbol("isImmutable");

export function isImmutable(value) {
  return !!(value && value[IMMUTABLE_MARKER]);
}

export function fromJS(jsValue) {
  if (jsValue === null || typeof jsValue !== "object") {
    return jsValue;
  }

  // If it's already one of our immutable types, return it directly.
  if (isImmutable(jsValue)) {
    return jsValue;
  }

  if (Array.isArray(jsValue)) {
    return new List(jsValue.map(fromJS));
  }

  const mapData = {};
  for (const key in jsValue) {
    if (Object.prototype.hasOwnProperty.call(jsValue, key)) {
      mapData[key] = fromJS(jsValue[key]);
    }
  }
  return new Map(mapData);
}

export class Map {
  constructor(data = {}) {
    this._data = { ...data };
    Object.defineProperty(this, IMMUTABLE_MARKER, { value: true });
    Object.freeze(this._data);
    Object.freeze(this);
  }

  get(key, defaultValue) {
    return this._data.hasOwnProperty(key) ? this._data[key] : defaultValue;
  }

  set(key, value) {
    const newData = { ...this._data, [key]: fromJS(value) };
    return new Map(newData);
  }

  getIn(path, defaultValue) {
    let currentValue = this;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (
        currentValue instanceof Map &&
        currentValue._data.hasOwnProperty(key)
      ) {
        currentValue = currentValue._data[key];
      } else if (
        currentValue instanceof List &&
        Number.isInteger(key) &&
        key >= 0 &&
        key < currentValue._data.length
      ) {
        currentValue = currentValue._data[key];
      } else {
        return defaultValue;
      }
    }
    return currentValue;
  }

  setIn(path, value) {
    if (path.length === 0) {
      return fromJS(value);
    }

    const key = path[0];
    if (path.length === 1) {
      return this.set(key, value);
    }

    const currentVal = this.get(key);
    let newBranch;

    if (isImmutable(currentVal)) {
      newBranch = currentVal.setIn(path.slice(1), value);
    } else {
      // If the path does not exist or is not an immutable structure, create it.
      // Determine whether to create a Map or List based on the next key in the path.
      const nextKey = path[1];
      if (typeof nextKey === "number") {
        newBranch = new List().setIn(path.slice(1), value);
      } else {
        newBranch = new Map().setIn(path.slice(1), value);
      }
    }
    return this.set(key, newBranch);
  }

  update(key, updaterFn) {
    const currentValue = this.get(key);
    return this.set(key, updaterFn(currentValue));
  }

  updateIn(path, updaterFn) {
    if (path.length === 0) {
      return updaterFn(this);
    }
    const currentValue = this.getIn(path);
    return this.setIn(path, updaterFn(currentValue));
  }

  toJS() {
    const plainObject = {};
    for (const key in this._data) {
      if (Object.prototype.hasOwnProperty.call(this._data, key)) {
        const value = this._data[key];
        // Check if the value has a toJS method (i.e., it's one of our immutable instances)
        if (value && typeof value.toJS === "function") {
          plainObject[key] = value.toJS();
        } else {
          plainObject[key] = value;
        }
      }
    }
    return plainObject;
  }

  equals(other) {
    if (this === other) return true;
    if (!(other instanceof Map)) return false;
    if (Object.keys(this._data).length !== Object.keys(other._data).length)
      return false;

    for (const key in this._data) {
      if (!Object.prototype.hasOwnProperty.call(other._data, key)) return false;
      const thisVal = this._data[key];
      const otherVal = other._data[key];
      if (isImmutable(thisVal) && isImmutable(otherVal)) {
        if (!thisVal.equals(otherVal)) return false;
      } else if (thisVal !== otherVal) {
        return false;
      }
    }
    return true;
  }
}

export class List {
  constructor(data = []) {
    this._data = [...data];
    Object.defineProperty(this, IMMUTABLE_MARKER, { value: true });
    Object.freeze(this._data);
    Object.freeze(this);
  }

  get(index, defaultValue) {
    if (index >= 0 && index < this._data.length) {
      return this._data[index];
    }
    return defaultValue;
  }

  set(index, value) {
    // Allow setting at index === this._data.length to append.
    // For index > this._data.length, or index < 0, it returns the original list.
    // This adjustment is crucial for setIn to be able to build nested Lists.
    if (index < 0 || index > this._data.length) {
      // console.warn(`List.set: Index ${index} out of bounds (length ${this._data.length})`);
      return this; // Or throw error for stricter "set" that doesn't append
    }
    const newData = [...this._data];
    newData[index] = fromJS(value);
    return new List(newData);
  }

  push(value) {
    const newData = [...this._data, fromJS(value)];
    return new List(newData);
  }

  delete(index) {
    if (index < 0 || index >= this._data.length) {
      return this; // Index out of bounds
    }
    const newData = [...this._data];
    newData.splice(index, 1);
    return new List(newData);
  }

  update(index, updaterFn) {
    const currentValue = this.get(index);
    // If currentValue is undefined, the index is out of bounds.
    if (currentValue === undefined) {
      return this; // Return the original list without applying updaterFn.
    }
    return this.set(index, updaterFn(currentValue));
  }

  getIn(path, defaultValue) {
    let current = this;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (current instanceof Map && current._data.hasOwnProperty(key)) {
        current = current._data[key];
      } else if (
        current instanceof List &&
        Number.isInteger(key) &&
        key >= 0 &&
        key < current._data.length
      ) {
        current = current._data[key];
      } else {
        return defaultValue;
      }
    }
    return current;
  }

  setIn(path, value) {
    if (path.length === 0) {
      // If path is empty, the value should replace this List.
      // fromJS will handle turning it into an immutable structure if it's an object/array.
      return fromJS(value);
    }

    const index = path[0];
    // Ensure index is a number for List operations
    if (typeof index !== "number" || index < 0) {
      // Or throw an error, for now, return original if path is invalid for a list
      console.warn(`Invalid path segment for List: ${index}`);
      return this;
    }

    if (path.length === 1) {
      return this.set(index, value);
    }

    const currentValue = this.get(index);
    let newBranch;

    if (isImmutable(currentValue)) {
      newBranch = currentValue.setIn(path.slice(1), value);
    } else {
      // If the path does not exist or is not an immutable structure at the current index, create it.
      const nextKey = path[1];
      if (typeof nextKey === "number") {
        newBranch = new List().setIn(path.slice(1), value);
      } else {
        newBranch = new Map().setIn(path.slice(1), value);
      }
    }
    return this.set(index, newBranch);
  }

  updateIn(path, updaterFn) {
    if (path.length === 0) {
      return updaterFn(this);
    }
    const currentValue = this.getIn(path);
    return this.setIn(path, updaterFn(currentValue));
  }

  toJS() {
    return this._data.map((value) => {
      if (isImmutable(value)) {
        return value.toJS();
      }
      return value;
    });
  }

  equals(other) {
    if (this === other) return true;
    if (!(other instanceof List)) return false;
    if (this._data.length !== other._data.length) return false;

    for (let i = 0; i < this._data.length; i++) {
      const thisVal = this._data[i];
      const otherVal = other._data[i];
      if (isImmutable(thisVal) && isImmutable(otherVal)) {
        if (!thisVal.equals(otherVal)) return false;
      } else if (thisVal !== otherVal) {
        return false;
      }
    }
    return true;
  }
}
