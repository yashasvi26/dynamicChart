import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { loadScript } from 'lightning/platformResourceLoader';
import getIrctcPrice from '@salesforce/apex/IrctcPrice.getIrctcPrice';
import {subscribe, unsubscribe, onError} from 'lightning/empApi';

import chartjs from '@salesforce/resourceUrl/chartJs';

const generateRandomNumber = () => {
    return Math.round(Math.random() * 100);
};

export default class LibsChartjs extends LightningElement {
    error;
    chart;
    chartjsInitialized = false;
    
    channelName = '/data/IRCTC__ChangeEvent';
    
    subscription = {}; //subscription information

    config = {
        type: 'line',
        data: {
            datasets: [
                {
                    data: [
                    ],
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)'
                    ],
                    label: 'Irctc Price'
                }
            ],
            labels: []
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };

    renderedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        this.chartjsInitialized = true;

        loadScript(this, chartjs)
            .then(() => {
                const ctx = this.template.querySelector('canvas.barChart').getContext('2d');
                this.chart = new window.Chart(ctx, this.config);
            })
            .catch((error) => {
                this.error = error;
                console.log('error', error);
            });
    }



    // Initializes the component
    connectedCallback() {       
        this.handleSubscribe();
        // Register error listener       
        this.registerErrorListener();   
    }

    // Handles subscribing
    handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const messageCallback = (response) => {
            console.log('New message received: ', JSON.stringify(response));
            // Response contains the payload of the new message received
            this.handleNotification(response);
        };

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
            this.subscription = response;
        });
    }

    // Handles unsubscribing
    handleUnsubscribe() {
        // Invoke unsubscribe method of empApi
        unsubscribe(this.subscription, response => {
            console.log('unsubscribe() response: ', JSON.stringify(response));
            // Response is true for successful unsubscribe
        });
    }


    registerErrorListener() {
        // Invoke onError empApi method
        onError(error => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }

    //this method checks if current record got updated and shows message on UI
    handleNotification(response){

        console.log('response org', response);
        if(response.data.payload.ChangeEventHeader.changeType == 'CREATE'){
            let today = new Date().toDateString();
            let responseDate = new Date(response.data.payload.CreatedDate);
            responseDate = responseDate.toDateString();
            if(responseDate == today){
                console.log('Yes Created Today', response.data.payload.CreatedDate);
                this.refreshData();
            }
        }
    }

    refreshData(){
        return refreshApex(this.wiredIrctc);
    }

    irctc
    timeLabel = [];

    wiredIrctc

    @wire(getIrctcPrice)
    handleIrctc(value) {
        this.wiredIrctc = value;

        let {error, data} = value;
        if(data) {
            this.irctc = data.map(val => val.Price__c);
            this.timeLabel = data.map(val => new Date(val.CreatedDate).toLocaleTimeString('en', {hour:'2-digit', minute:'2-digit'}));
            console.log('Irctc', this.irctc)
            console.log('time:', this.timeLabel)

            this.config.data.datasets[0].data = this.irctc;
            this.config.data.labels = this.timeLabel;


            console.log('config', this.config);
            if(this.chart){
                this.chart.update();
            }
        } else if(error) {
            console.log('error', error)
        }
    }

    
}
