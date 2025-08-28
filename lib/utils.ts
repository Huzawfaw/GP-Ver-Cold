export function isCompany(x: string): x is "connectiv" | "booksnpayroll" {
    return x === "connectiv" || x === "booksnpayroll";
    }