import {ethers} from "ethers";

export default class ContractInfo {

    service_fee_type_element: HTMLInputElement
    smart_contract_address_element: HTMLInputElement;
    service_fee_address_element: HTMLInputElement;
    service_fee_element: HTMLInputElement;
    name_element: HTMLInputElement;
    url_element: HTMLInputElement;
    email_element: HTMLInputElement;
    terms_element: HTMLInputElement;

    serviceFeeType = 1;
    smartContractAddress = '';
    serviceFeeAddress = '';
    serviceFee = '';
    name = '';
    url = '';
    email = '';
    terms = false;


    constructor() {
        this.service_fee_type_element = document.querySelector('#smart_contract_address') as HTMLInputElement;
        this.smart_contract_address_element = document.querySelector('#smart_contract_address') as HTMLInputElement;
        this.service_fee_address_element = document.querySelector('#service_fee_address') as HTMLInputElement;
        this.service_fee_element = document.querySelector('#service_fee') as HTMLInputElement;
        this.name_element = document.querySelector('#name') as HTMLInputElement;
        this.url_element = document.querySelector('#url') as HTMLInputElement;
        this.email_element = document.querySelector('#email') as HTMLInputElement;
        this.terms_element = document.querySelector('#terms') as HTMLInputElement;
    }

    public loadValues() {
        this.serviceFeeType = parseInt(this.service_fee_type_element.value);
        this.smartContractAddress = this.smart_contract_address_element.value;
        this.serviceFeeAddress = this.service_fee_address_element.value;
        this.serviceFee = this.service_fee_element.value;
        this.name = this.name_element.value;
        this.url = this.url_element.value.replace('https://', '').replace('http://', '');
        this.email = this.email_element.value;
        this.terms = this.terms_element.checked;
    }

    public validate() {
        this.loadValues()
        if (this.serviceFeeType == 3) return;

        if (this.serviceFeeType == 1 && !ethers.isAddress(this.smartContractAddress)) {
            this.isInvalid(this.smart_contract_address_element)
        } else {
            this.isValid(this.smart_contract_address_element);
        }

        if (!ethers.isAddress(this.serviceFeeAddress)) {
            this.isInvalid(this.service_fee_address_element);
        } else {
            this.isValid(this.smart_contract_address_element);
        }

        if (isNaN(parseInt(this.serviceFee))) {
            this.isInvalid(this.service_fee_element)
        } else {
            this.isValid(this.smart_contract_address_element);
        }

        if (this.name.trim() == '') {
            this.isInvalid(this.name_element);
        } else {
            this.isValid(this.name_element);
        }

        if (this.url.trim() == '') {
            this.isInvalid(this.url_element);
        } else {
            this.isValid(this.url_element);
        }

        if (this.email.indexOf('@') == -1) {
            this.isInvalid(this.email_element);
        } else {
            this.isValid(this.email_element);
        }
    }

    public setServiceFeeType(type : number) {
        if (type == 1) {
            this.smart_contract_address_element.parentElement!.classList.add('hidden')
        }

        if (type == 2) {
            this.smart_contract_address_element.parentElement!.classList.remove('hidden')
        }

        if (type == 3) {
            document.querySelector('#contract_form')!.classList.add('hidden')
            document.querySelector('#get_started')!.classList.remove('hidden')
        } else {
            document.querySelector('#contract_form')!.classList.remove('hidden')
            document.querySelector('#get_started')!.classList.add('hidden')
        }
    }

    private isValid(element : HTMLInputElement) {
        element.setAttribute('aria-invalid', 'true')
        element.focus();
    }
    private isInvalid(element: HTMLInputElement) {
        element.setAttribute('aria-invalid', 'false')
        element.focus();
    }


}