// GOATED BACKEND DEV OSTAD 007

export type Perm = { byte: number; bit: number };
function perm(byte: number, bit: number): Perm {
    return { byte, bit }
}

export class AdminPerms {
    static MASTER: Perm = perm(0, 0)
    static V_USER: Perm = perm(0, 1)
    static A_USER: Perm = perm(0, 2)
    static C_USER: Perm = perm(0, 3)
    static D_USER: Perm = perm(0, 4)
    static V_PRODUCT: Perm = perm(0, 5)
    static A_PRODUCT: Perm = perm(0, 6)
    static C_PRODUCT: Perm = perm(0, 7)
    static D_PRODUCT: Perm = perm(1, 0)
    static V_PRODUCT_KIND: Perm = perm(1, 1)
    static A_PRODUCT_KIND: Perm = perm(1, 2)
    static C_PRODUCT_KIND: Perm = perm(1, 3)
    static D_PRODUCT_KIND: Perm = perm(1, 4)
    static V_PRODUCT_CATS: Perm = perm(1, 5)
    static A_PRODUCT_CATS: Perm = perm(1, 6)
    static C_PRODUCT_CATS: Perm = perm(1, 7)
    static D_PRODUCT_CATS: Perm = perm(2, 0)
    static V_BROKER: Perm = perm(2, 1)
    static A_BROKER: Perm = perm(2, 2)
    static C_BROKER: Perm = perm(2, 3)
    static D_BROKER: Perm = perm(2, 4)
    static V_ORDER: Perm = perm(2, 5)
    static A_ORDER: Perm = perm(2, 6)
    static C_ORDER: Perm = perm(2, 7)
    static D_ORDER: Perm = perm(3, 0)
    static V_TRANSACTIONS: Perm = perm(3, 1)
    static C_TRANSACTIONS: Perm = perm(3, 2)
    static V_MOTORCYCLE: Perm = perm(3, 5)
    static A_MOTORCYCLE: Perm = perm(3, 6)
    static C_MOTORCYCLE: Perm = perm(3, 7)
    static D_MOTORCYCLE: Perm = perm(4, 0)
}



// shout-out to the goat backend dev Ostad 007