const strengthMeter = document.getElementById('strength-meter')
const passwordInput = document.getElementById('password-input')
const reasonsContainer = document.getElementById('reasons')
const strongName = document.getElementById('strongName')

passwordInput.addEventListener('input', updateStrengthMeter)
updateStrengthMeter()

function insert(str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
}

function updateStrengthMeter(){
    const weaknesses = calculatePasswordStrength(passwordInput.value)
    let strength = 100
    let color = ""
    weak = ""
    message = ""
    reasonsContainer.innerHTML = ''

    weaknesses.forEach(weakness => {

        if (weakness == null) return
        strength -= weakness.deduction

        if (strength >= 80 && strength < 100){
            color = "green"
            weak = "Strong"
        }

        if (strength <= 79 && strength >= 60){
            color = "#CCCC00"
            weak = "Moderate"
        }

        if (strength <= 59 && strength >= 40){
            color = "orange"
            weak = "Fair"
        }

        if (strength <= 39){
            color = "red"
            weak = "Weak"
        }

        message = weakness.message
    })

    if (strength == 100){
        color = "lime"
        weak = ""
        weak = "Very Strong"
    }

    if (strength <= 0){
        color = "dimgray"
        weak = ""
        weak = "Very Weak"
    }

    strengthMeter.style.setProperty('--strength', strength)
    strengthMeter.style.setProperty('--color', color)
    strongName.style.setProperty('color', color)
    if (message != ""){
        strongName.innerText = weak + ", " + message

        if (passwordInput.value.length == 0) {
            strongName.innerText = "Please Enter a Password"
        } 

    } else {
        strongName.innerText = weak
    }
}

function calculatePasswordStrength(password){
    const weaknesses = []
    weaknesses.push(specialWeakness(password))
    weaknesses.push(numberWeakness(password))
    weaknesses.push(uppercaseWeakness(password))
    weaknesses.push(lowercaseWeakness(password))
    weaknesses.push(lengthWeakness(password))
    return weaknesses
}

function lengthWeakness(password) {
    const length = password.length

    if (length <= 4) {
        return {
            message: 'Password is too short',
            deduction: 20
        }
    }
}

function lowercaseWeakness(password) {
    return characterTypeWeakness(password, /[a-z]/g, 'lowercase')
}

function uppercaseWeakness(password) {
    return characterTypeWeakness(password, /[A-Z]/g, 'uppercase')
}

function numberWeakness(password) {
    return characterTypeWeakness(password, /[0-9]/g, 'number')
}

function specialWeakness(password) {
    return characterTypeWeakness(password, /[^0-9a-zA-Z\s]/g, 'special')
}

function characterTypeWeakness(password, regex, type) {
    const matches = password.match(regex) || []

    if (matches.length === 0) {
        return {
            message: `Your password has no ${type} characters`,
            deduction: 20
        }
    }
}