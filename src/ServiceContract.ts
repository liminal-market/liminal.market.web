import {Contract, BigNumberish, ethers} from "ethers";
import {Liquid} from "liquidjs";

export default class ServiceContract {

    serviceContractAddress = '0x9B946889657e8f2D943A3841282fBf5751241E85';
    serviceContract : Contract;
    ethereum : any;
    selector = '';
    smartContractAddress = '';
    serviceFeeAddress = '';
    serviceFee : BigNumberish = 0;
    name = '';
    url = '';
    terms = false;
    signButton : HTMLButtonElement;
    constructor(selector : string) {
        // @ts-ignore
        this.ethereum = window.ethereum!;
        this.serviceContract = new Contract(this.serviceContractAddress, ServiceContract.abi, this.ethereum);
        this.selector = selector;
        this.signButton = document.createElement('button');

        let dom = document.querySelector(selector);
        if (!dom) {
            console.error('Could not find selector ' + selector + ' in dom. Module will not load')
            return;
        }
        const engine = new Liquid({root: './src/views', extname: '.html' });

        dom.innerHTML = engine.renderFileSync('ContractForm');
        this.signButton = document.querySelector('#sign')! as HTMLButtonElement;
    }


    public async load() {
        this.connectWallet();

        this.toggleWrongChainError()

        this.loadVariables();
        this.createOrUpdate();
        this.bindEvents();



    }

    private async connectWallet() {
        const provider = new ethers.BrowserProvider(this.ethereum);
        await provider.getSigner(0)
            .then(signer => {
                this.serviceContract = new Contract(this.serviceContractAddress, ServiceContract.abi, signer);
                this.createOrUpdate();
            })
            .catch((e : any) => {
                if (e.message.indexOf('already pending') != -1) {
                    this.needToConnectWallet();
                } else {
                    this.needToConnectWallet();
                }
            })
    }

    private needToConnectWallet() {
        this.signButton.innerHTML = 'You need to have wallet installed'
    }

    private toggleWrongChainError() {
        let chainId = parseInt(this.ethereum.chainId, 16);
        if (isNaN(chainId)) return;

        console.log('chainId', chainId)
        if (chainId != 31337) {
            document.getElementById('wrongNetwork')!.classList.remove('hidden')
        } else {
            document.getElementById('wrongNetwork')!.classList.add('hidden')
        }

    }

    public loadVariables() {
        let smart_contract_address = document.querySelector('#smart_contract_address') as HTMLInputElement;
        let service_fee_address = document.querySelector('#service_fee_address') as HTMLInputElement;
        let service_fee = document.querySelector('#service_fee') as HTMLInputElement;
        let name = document.querySelector('#name') as HTMLInputElement;
        let url = document.querySelector('#url') as HTMLInputElement;
        let terms = document.querySelector('#terms') as HTMLInputElement;

        this.smartContractAddress = smart_contract_address.value;
        this.serviceFeeAddress = service_fee_address.value;
        this.serviceFee = service_fee.value;
        this.name = name.value;
        this.url = url.value;
        this.terms = terms.checked;

    }
    private bindEvents() {
        let smart_contract_address = document.querySelector('#smart_contract_address') as HTMLInputElement;
        smart_contract_address.addEventListener('change', async () => {
            this.createOrUpdate();
        });

        this.signButton.addEventListener('click', async (evt) => {
            evt.preventDefault();
            let accounts = await this.ethereum.request({method: "eth_requestAccounts"});
            if (this.signButton.innerHTML == 'Update contract') {
                let result = await this.serviceContract.updateContract(this.smartContractAddress, this.serviceContractAddress,
                    this.serviceFee, this.name, this.url);

                console.log(result);
            } else {
                let result = await this.serviceContract.createContract(this.smartContractAddress, this.serviceContractAddress,
                    this.serviceFee, this.name, this.url);

                console.log(result);
            }
            if (!this.validateForm()) return;


        })
    }
    private async createOrUpdate() {
        this.loadVariables()
        if (this.smartContractAddress == '') {
            this.signButton.innerHTML = 'Sign contract';
            return;
        }
        console.log('address:', this.smartContractAddress)

        let address = await this.serviceContract.getServiceFeeAddress(this.smartContractAddress)
            .catch((e : any) => {
                this.signButton.innerHTML = 'Sign contract';
            });
        console.log(address);

        if (address && !address.startsWith('0x00000')) {
            this.signButton.innerHTML = 'Update contract';
            return;
        }

    }

    public validateForm() {
        let smart_contract_address = document.querySelector('#smart_contract_address') as HTMLInputElement;
        let service_fee_address = document.querySelector('#service_fee_address') as HTMLInputElement;
        let service_fee = document.querySelector('#service_fee') as HTMLInputElement;
        let name = document.querySelector('#name') as HTMLInputElement;
        let url = document.querySelector('#url') as HTMLInputElement;
        let terms = document.querySelector('#terms') as HTMLInputElement;


        if (this.smartContractAddress.trim() == '') {
            smart_contract_address.focus();
            return;
        }
        if (service_fee_address.value.trim() == '') {
            service_fee_address.focus();
            return;
        }
        if (service_fee.value.trim() == '') {
            service_fee.focus();
            return;
        }
        if (name.value.trim() == '') {
            name.focus();
            return;
        }
        if (url.value.trim() == '') {
            url.focus();
            return;
        }
        if (!terms.checked) {
            service_fee.focus();
            return;
        }

        return true;
    }

    static abi = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spenderAddress",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "serviceFeeAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "serviceFeePoints",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "url",
                    "type": "string"
                }
            ],
            "name": "createContract",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spenderAddress",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "serviceFeeAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "serviceFeePoints",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "url",
                    "type": "string"
                }
            ],
            "name": "updateContract",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                }
            ],
            "name": "getServiceFeeAddress",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]






}