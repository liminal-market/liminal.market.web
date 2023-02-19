import {Contract, BigNumberish, ethers} from "ethers";
import {Liquid} from "liquidjs";
import ContractInfo from "./ContractInfo";

export default class ServiceContract {

    serviceContractAddress = '0x9B946889657e8f2D943A3841282fBf5751241E85';
    serviceContract!: Contract;
    selector = '';
    signButton!: HTMLButtonElement;
    contractInfo!: ContractInfo;
    ethereum : any;
    browserProvider: any;
    listenerProvider!: ethers.providers.WebSocketProvider;
    listeningToContractCreated = false;
    listeningToContractUpdated = false;
    engine! : Liquid;
    constructor(selector: string) {
        let dom = document.querySelector(selector);
        if (!dom) {
            console.error('Could not find selector ' + selector + ' in dom. Module will not load')
            return;
        }
        // @ts-ignore
        this.ethereum = window.ethereum!;

        this.engine = new Liquid({root: './views', extname: '.html'});
        dom.innerHTML = this.engine.renderFileSync('ContractForm');

        this.selector = selector;
        this.contractInfo = new ContractInfo();
        this.signButton = document.querySelector('#sign')! as HTMLButtonElement;


        if (!this.ethereum) {
            this.showErrorMessage('You need to have wallet installed to sign the contract')
            this.needToConnectWallet();
        }
        this.browserProvider = new ethers.providers.Web3Provider(this.ethereum);
        this.listenerProvider = new ethers.providers.WebSocketProvider('https://polygon-mumbai.g.alchemy.com/v2/3PB6LtoG1T86WlVsouZ6Qrd0UXQ1wwLd');
        this.serviceContract = new Contract(this.serviceContractAddress, ServiceContract.abi, this.browserProvider);
    }


    public async load() {
        this.toggleWrongChainError()

        this.createOrUpdate();
        this.bindEvents();


    }
    private needToConnectWallet() {
        this.signButton.innerHTML = 'You need to have wallet installed'
    }

    private toggleWrongChainError() {
        if (!this.ethereum) return;

        let chainId = parseInt(this.ethereum.chainId, 16);
        if (isNaN(chainId)) return;

        if (chainId != 80001) {
            this.showErrorMessage('You are on the wrong network, switch to Mumbai')
        } else {
            this.hideErrorMessage();
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

        let update_service = document.getElementById('update_service');
        update_service?.addEventListener('click', async (evt) => {
            evt.preventDefault();

            let owner = this.ethereum.selectedAddress;
            if (!owner) {
                let accounts = await this.ethereum.request({method: "eth_requestAccounts"});
                owner = accounts[0]
            }

            let contracts = await this.serviceContract.getContractsByOwner(owner);
            console.log(contracts);
            if (contracts.length == 0) {
                alert('Address ' + owner + ' is not a owner of any service contract');
                return;
            }

            document.getElementById('update_contract')?.classList.remove('hidden')
            let select = document.getElementById('selectedServiceContract') as HTMLSelectElement;
            select.innerHTML = '';
            for (let i=0;i<contracts.length;i++) {
                let optionElement = document.createElement('option');
                optionElement.value = contracts[i]
                optionElement.text = contracts[i];
                select.options.add(optionElement)
            }
        })

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

            const signer = this.browserProvider.getSigner()
            let signingContract = new Contract(this.serviceContractAddress, ServiceContract.abi, signer);

            let listeningContract = new Contract(this.serviceContractAddress, ServiceContract.abi, this.listenerProvider);
            let result: any = null;
            let showWaiting = true;
            if (this.signButton.innerHTML == 'Update contract') {
                console.log('update')
                if (!this.listeningToContractUpdated) {
                    listeningContract.on('ServiceContractUpdated', (signerAddress: string, serviceAddress: string, serviceFeeAddress: string, serviceFeePoints: string, name: string, url: string) => {
                        showWaiting = false
                        console.log('update event')
                        this.transactionDone(signerAddress, serviceAddress, serviceFeeAddress, serviceFeePoints, name, url, {});
                    })
                }
                result = await signingContract.updateContract(this.contractInfo.smartContractAddress, this.contractInfo.serviceFeeAddress,
                    this.contractInfo.serviceFee, this.contractInfo.name, this.contractInfo.url);

            } else {
                if (!this.listeningToContractCreated) {
                    listeningContract.on('ServiceContractCreated', (signerAddress: string, serviceAddress: string, serviceFeeAddress: string, serviceFeePoints: string, name: string, url: string) => {
                        console.log('created event')
                        showWaiting = false
                        this.transactionDone(signerAddress, serviceAddress, serviceFeeAddress, serviceFeePoints, name, url, {});
                    })
                }
                console.log('create')
                result = await signingContract.createContract(this.contractInfo.smartContractAddress, this.contractInfo.serviceFeeAddress,
                    this.contractInfo.serviceFee, this.contractInfo.name, this.contractInfo.url);
            }

            if (result && showWaiting) {
console.log('wait for trans')
                this.waitForTransaction();
            }
        })
    }

    private async createOrUpdate() {
        if (!this.ethereum) return;

        this.contractInfo.loadValues();
        console.log('smartContractAddress', this.contractInfo.smartContractAddress)
        if (this.contractInfo.smartContractAddress == '') {
            this.signButton.innerHTML = 'Sign contract';
            return;
        }
        console.log('address:', this.contractInfo.smartContractAddress)

        let address = await this.serviceContract.getServiceFeeAddress(this.contractInfo.smartContractAddress)
            .catch((e: any) => {
                this.signButton.innerHTML = 'Sign contract';
            });
        console.log('hasFeeAddress:', address);

        if (address && !address.startsWith('0x00000')) {
            this.signButton.innerHTML = 'Update contract';
            return;
        }

    }

    private waitForTransaction() {
        window.scrollTo({top: 0, behavior: 'smooth'});
        document.getElementById('wait_for_transaction')?.classList.remove('hidden')
        document.querySelector('#contract_form')?.classList.add('hidden')
        document.querySelector('#get_started')?.classList.add('hidden')

    }

    private transactionDone(signerAddress: string, serviceAddress: string, serviceFeeAddress: string, serviceFeePoints: string, name: string, url: string, blockInfo: any) {
        console.log('transactionDone', signerAddress, serviceAddress, serviceFeeAddress, serviceFeePoints, name, url, blockInfo);
        document.getElementById('serviceContractAddressInfo')?.classList.remove('hidden');
        (document.getElementById('serviceAddress') as HTMLInputElement).value = serviceAddress;

        this.contractInfo.smartContractAddress = serviceAddress;
        this.contractInfo.showCodeExample();
    }

    private showErrorMessage(error: string) {
        document.getElementById('error')?.classList.remove('hidden')
        document.getElementById('error')!.innerHTML = error;
    }

    private hideErrorMessage() {
        document.getElementById('error')?.classList.add('hidden')

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
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "signerAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "serviceAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "serviceFeeAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "serviceFeePoints",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "url",
                    "type": "string"
                }
            ],
            "name": "ServiceContractCreated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "signerAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "serviceAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "serviceFeeAddress",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "serviceFeePoints",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "url",
                    "type": "string"
                }
            ],
            "name": "ServiceContractUpdated",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "getContractsByOwner",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "owner",
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
                            "internalType": "bool",
                            "name": "active",
                            "type": "bool"
                        }
                    ],
                    "internalType": "struct ServiceContract.ServiceInfo[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}