import axios from 'axios'

export default class RegistrationForm {
    constructor() {
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.form = document.querySelector("#registration-form")
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ''
        this.email = document.querySelector("#email-register")
        this.email.previousValue = ''
        this.password = document.querySelector("#password-register")
        this.password.previousValue = ''
        this.username.isUnique = false
        this.email.isUnique = false

        this.events()

    }

    //events
    events() {
        this.form.addEventListener("submit", (e) => {
            e.preventDefault()
            this.formSubmitHandler()
        })

        this.username.addEventListener("keyup", () =>{
            this.isDifferent(this.username, this.usernameHandler())
        })

        this.email.addEventListener("keyup", () =>{
            this.isDifferent(this.email, this.emailHandler())
        })

        this.password.addEventListener("keyup", () =>{
            this.isDifferent(this.password, this.passwordHandler())
        })
        //fixed quick input switch bug
        this.username.addEventListener("blur", () =>{
            this.isDifferent(this.username, this.usernameHandler())
        })

        this.email.addEventListener("blur", () =>{
            this.isDifferent(this.email, this.emailHandler())
        })

        this.password.addEventListener("blur", () =>{
            this.isDifferent(this.password, this.passwordHandler())
        })
    }
    //methods
    insertValidationElements(){
        this.allFields.forEach(function(el) {
            el.insertAdjacentHTML("afterend", '<div class="alert alert-danger small liveValidateMessage"></div>')
        })
    }

    isDifferent(el, handler){
        if(el.previousValue != el.value){
            handler.call(this)
        }
        el.previousValue = el.value
    }

    usernameHandler() {
        this.username.errors = false
        this.usernameImmediately()
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
    }

    passwordHandler() {
        this.password.errors = false
        clearTimeout(this.password.timer)
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
    }

    emailHandler() {
        this.email.errors = false
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
    }

    usernameImmediately() {
        if(this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)){
            this.showValidationError(this.username, "Username can only contain letters and numbers!")
        }

        if(!this.username.erors){
            this.hideValidationError(this.username)
        }
    }

    usernameAfterDelay() {
        if(this.username.value.length < 3){
            this.showValidationError(this.username, "Username must be atleast 3 characters!")
        }

        if(!this.username.errors){
            axios.post("/doesUsernameExists", {username: this.username.value, _csrf: this._csrf}).then((response) => {
                if(response.data){
                    this.showValidationError(this.username, "Username already exists!")
                    this.username.isUnique = false
                }else{
                    this.username.isUnique = true
                    this.hideValidationError(this.username)
                }
            }).catch(() => {

            })
        }
    }

    emailAfterDelay() {
        if(!/^\S+@\S+$/.test(this.email.value)){
            this.showValidationError(this.email, "You must provide a valid email")
        }

        if(!this.email.errors){
            axios.post("/doesEmailExists", {email: this.email.value, _csrf: this._csrf}).then((response) => {
                if(response.data){
                    this.showValidationError(this.email, "Email already exists!")
                    this.email.isUnique = false
                }else{
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(() => {

            })
        }
    }

    passwordAfterDelay() {
        if(this.password.value.length < 6){
            this.showValidationError(this.password, "Password must be atleast 6 characters!")
        }
    }

    formSubmitHandler(){
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordAfterDelay()

        if(this.username.isUnique && !this.username.errors && this.email.isUnique && !this.email.errors && !this.password.erors){
            this.form.submit()
        }
    }

    hideValidationError(el){
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }

    showValidationError(el, msg){
        el.nextElementSibling.innerHTML = msg
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }
}