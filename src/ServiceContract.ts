import {Contract, BigNumberish, ethers} from "ethers";
import {Liquid} from "liquidjs";
import ContractInfo from "./ContractInfo";

export default class ServiceContract {

    serviceContractAddress = '0x9B946889657e8f2D943A3841282fBf5751241E85';
    serviceContract: Contract;
    ethereum: any;
    selector = '';
    signButton: HTMLButtonElement;

    contractInfo!: ContractInfo;

    constructor(selector: string) {
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

        const engine = new Liquid({root: './views', extname: '.html'});
        dom.innerHTML = engine.renderFileSync('ContractForm');

        this.contractInfo = new ContractInfo();
        this.signButton = document.querySelector('#sign')! as HTMLButtonElement;


    }


    public async load() {
        this.connectWallet();

        this.toggleWrongChainError()

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
            .catch((e: any) => {
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

    private bindEvents() {
        this.contractInfo.smart_contract_address_element.addEventListener('change', async () => {
            this.createOrUpdate();
        });

        let service_fees = document.querySelectorAll('.service_fee');
        for (let i = 0; i < service_fees.length; i++) {
            let input = service_fees[i] as HTMLInputElement;
            input.addEventListener('click', (evt) => {
                let input = evt.target as HTMLInputElement;
                this.contractInfo.setServiceFeeType(parseInt(input.value))
            })
        }

        let back_to_contract = document.getElementById('back_to_contract');
        back_to_contract?.addEventListener('click', (evt) => {
            evt.preventDefault();
            document.getElementById('service_fee_1')!.click();
        })
        let start_coding = document.getElementById('start_coding');
        start_coding?.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.contractInfo.setServiceFeeType(3)
        })

        this.signButton.addEventListener('click', async (evt) => {
            evt.preventDefault();
            let accounts = await this.ethereum.request({method: "eth_requestAccounts"});
            if (this.signButton.innerHTML == 'Update contract') {
                let result = await this.serviceContract.updateContract(this.contractInfo.smartContractAddress, this.contractInfo.serviceFeeAddress,
                    this.contractInfo.serviceFee, this.contractInfo.name, this.contractInfo.url);

                console.log(result);
            } else {
                let result = await this.serviceContract.createContract(this.contractInfo.smartContractAddress, this.contractInfo.serviceFeeAddress,
                    this.contractInfo.serviceFee, this.contractInfo.name, this.contractInfo.url);

                console.log(result);
            }


        })
    }

    private async createOrUpdate() {
        this.contractInfo.loadValues();
        if (this.contractInfo.smartContractAddress == '') {
            this.signButton.innerHTML = 'Sign contract';
            return;
        }
        console.log('address:', this.contractInfo.smartContractAddress)

        let address = await this.serviceContract.getServiceFeeAddress(this.contractInfo.smartContractAddress)
            .catch((e: any) => {
                this.signButton.innerHTML = 'Sign contract';
            });
        console.log(address);

        if (address && !address.startsWith('0x00000')) {
            this.signButton.innerHTML = 'Update contract';
            return;
        }

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