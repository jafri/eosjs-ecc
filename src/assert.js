export const assert = (isTrue, error) => {
    if (isTrue) {
        return
    } else {
        throw new Error(error)
    }
}

export const assertEqual = (item1, item2, error) => {
    if (item1 == item2) {
        return
    } else {
        throw new Error(error)
    }
}

export const assertStrictEqual = (item1, item2, error) => {
    if (item1 === item2) {
        return
    } else {
        throw new Error(error)
    }
}