module.exports = class Payment {
    constructor() {

    }


    pay(ref, flag = true) {

        // ref is validated here, check with payment gateway
        if(flag) {
            return true
        } else {
            return false
        }
    }
}

