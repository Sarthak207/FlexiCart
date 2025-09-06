/**
 * RFID Reader Integration for Smart Cart (Node.js version)
 * Alternative implementation using Node.js for systems without Python
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

class RFIDReaderNode {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || 'http://localhost:8000/api/cart/add-item';
        this.port = options.port || '/dev/ttyUSB0';
        this.baudRate = options.baudRate || 9600;
        this.userId = options.userId || 'demo_user';
        
        // Product mapping (in production, this would come from database)
        this.productMapping = {
            'RF001': { id: '1', name: 'Red Apples', price: 2.99, weight: 150 },
            'RF002': { id: '2', name: 'Whole Wheat Bread', price: 1.99, weight: 400 },
            'RF003': { id: '3', name: 'Fresh Milk', price: 3.49, weight: 1000 },
            'RF004': { id: '4', name: 'Bananas', price: 1.29, weight: 120 },
            'RF005': { id: '5', name: 'Cheddar Cheese', price: 4.99, weight: 250 },
            'RF006': { id: '6', name: 'Croissants', price: 3.99, weight: 180 },
            'RF007': { id: '7', name: 'Orange Juice', price: 2.79, weight: 950 },
            'RF008': { id: '8', name: 'Chicken Breast', price: 7.99, weight: 450 },
        };
        
        this.serialPort = null;
        this.parser = null;
        this.running = false;
    }
    
    /**
     * Initialize the RFID reader
     */
    async initialize() {
        try {
            // Create serial port connection
            this.serialPort = new SerialPort({
                path: this.port,
                baudRate: this.baudRate,
                autoOpen: false
            });
            
            // Create parser for reading lines
            this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
            
            // Set up event handlers
            this.serialPort.on('open', () => {
                console.log('RFID reader connected');
                this.running = true;
            });
            
            this.serialPort.on('error', (err) => {
                console.error('Serial port error:', err);
            });
            
            this.parser.on('data', (data) => {
                this.handleRFIDData(data.trim());
            });
            
            // Open the port
            await new Promise((resolve, reject) => {
                this.serialPort.open((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
        } catch (error) {
            console.error('Failed to initialize RFID reader:', error);
            throw error;
        }
    }
    
    /**
     * Handle incoming RFID data
     * @param {string} data - Raw RFID data from serial port
     */
    handleRFIDData(data) {
        if (!data || data.length === 0) return;
        
        console.log(`RFID data received: ${data}`);
        
        // Extract RFID code (assuming format: "RFID:XXXXXX")
        const match = data.match(/RFID:([A-F0-9]+)/i);
        if (!match) {
            console.warn('Invalid RFID data format:', data);
            return;
        }
        
        const rfidCode = match[1];
        this.processRFIDCode(rfidCode);
    }
    
    /**
     * Process RFID code and add item to cart
     * @param {string} rfidCode - RFID code to process
     */
    async processRFIDCode(rfidCode) {
        try {
            // Look up product
            const productData = this.productMapping[rfidCode];
            
            if (!productData) {
                console.warn(`Unknown RFID code: ${rfidCode}`);
                this.indicateError();
                return;
            }
            
            console.log(`Found product: ${productData.name}`);
            
            // Add to cart
            const success = await this.sendToCart(productData);
            
            if (success) {
                this.indicateSuccess();
            } else {
                this.indicateError();
            }
            
        } catch (error) {
            console.error('Error processing RFID code:', error);
            this.indicateError();
        }
    }
    
    /**
     * Send product data to cart via API
     * @param {Object} productData - Product information
     * @returns {Promise<boolean>} - Success status
     */
    async sendToCart(productData) {
        try {
            const payload = {
                user_id: this.userId,
                product_id: productData.id,
                quantity: 1,
                scan_type: 'rfid',
                scan_value: productData.id, // Using product ID as scan value
                timestamp: Date.now() / 1000
            };
            
            const response = await axios.post(this.apiEndpoint, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            
            if (response.status === 200) {
                console.log(`Successfully added ${productData.name} to cart`);
                return true;
            } else {
                console.error(`Failed to add item to cart: ${response.status} - ${response.data}`);
                return false;
            }
            
        } catch (error) {
            console.error('API request failed:', error.message);
            return false;
        }
    }
    
    /**
     * Indicate successful scan
     */
    indicateSuccess() {
        console.log('✓ Success indicator');
        // In a real implementation, this would control LEDs, buzzers, etc.
        // Example: digitalWrite(SUCCESS_LED_PIN, HIGH);
        // setTimeout(() => digitalWrite(SUCCESS_LED_PIN, LOW), 100);
    }
    
    /**
     * Indicate error
     */
    indicateError() {
        console.warn('✗ Error indicator');
        // In a real implementation, this would control LEDs, buzzers, etc.
        // Example: digitalWrite(ERROR_LED_PIN, HIGH);
        // setTimeout(() => digitalWrite(ERROR_LED_PIN, LOW), 200);
    }
    
    /**
     * Start the RFID reading process
     */
    async start() {
        try {
            await this.initialize();
            console.log('RFID reader started. Waiting for tags...');
            
            // Keep the process running
            process.on('SIGINT', () => {
                console.log('\nShutting down RFID reader...');
                this.stop();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('Failed to start RFID reader:', error);
            process.exit(1);
        }
    }
    
    /**
     * Stop the RFID reader
     */
    stop() {
        this.running = false;
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close();
        }
    }
}

// Main execution
if (require.main === module) {
    const rfidReader = new RFIDReaderNode({
        apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:8000/api/cart/add-item',
        port: process.env.RFID_PORT || '/dev/ttyUSB0',
        userId: process.env.USER_ID || 'demo_user'
    });
    
    rfidReader.start().catch(console.error);
}

module.exports = RFIDReaderNode;
