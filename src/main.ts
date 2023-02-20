import ServiceContract from "./ServiceContract";
import hljs from "highlight.js";

let contract = document.getElementById('contract');
if (contract) {
    let serviceContract = new ServiceContract('#contract')
    serviceContract.domReady();
} else if (document.getElementById('index')) {
    let hljs = require('highlight.js');
    document.querySelectorAll('pre').forEach((el) => {
        hljs.highlightElement(el);
    });
}