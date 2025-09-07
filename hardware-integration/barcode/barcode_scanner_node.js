#!/usr/bin/env node

/**
 * Node.js Barcode Scanner Integration for Smart Cart (Caper AI Style)
 * Handles USB barcode scanners and integrates with the smart cart system
 */

const axios = require('axios');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class NodeBarcodeScanner {
    constructor(apiEndpoint = 'http://localhost:8000/api/cart/add-item') {
        this.apiEndpoint = apiEndpoint;
        this.port = null;
        this.parser = null;
        this.running = false;
        this.scanCooldown = 2000; // 2 seconds between scans
        this.recentScans = new Map();
        
        // Enhanced product database with common barcode formats
        this.productDatabase = {
            '000000000000': { id: '1', name: 'Red Apples', price: 2.99, weight: 150, category: 'fruits', brand: 'Fresh Farm' },
            '000000000001': { id: '2', name: 'Whole Wheat Bread', price: 1.99, weight: 400, category: 'bakery', brand: 'Artisan Bakery' },
            '000000000002': { id: '3', name: 'Fresh Milk', price: 3.49, weight: 1000, category: 'dairy', brand: 'Farm Fresh' },
            '000000000003': { id: '4', name: 'Bananas', price: 1.29, weight: 120, category: 'fruits', brand: 'Tropical Farms' },
            '000000000004': { id: '5', name: 'Cheddar Cheese', price: 4.99, weight: 250, category: 'dairy', brand: 'Artisan Cheese' },
            '000000000005': { id: '6', name: 'Croissants', price: 3.99, weight: 180, category: 'bakery', brand: 'French Bakery' },
            '000000000006': { id: '7', name: 'Orange Juice', price: 2.79, weight: 950, category: 'beverages', brand: 'Pure Orange' },
            '000000000007': { id: '8', name: 'Chicken Breast', price: 7.99, weight: 450, category: 'meat', brand: 'Premium Poultry' },
            
            // Common test barcodes
            '123456789012': { id: '9', name: 'Test Product', price: 1.00, weight: 100, category: 'test', brand: 'Test Brand' },
            '1234567890123': { id: '10', name: 'Demo Item', price: 5.00, weight: 200, category: 'demo', brand: 'Demo Co' },
            '4901234567890': { id: '11', name: 'Sample Product', price: 3.50, weight: 150, category: 'sample', brand: 'Sample Inc' },
            
            // UPC-A format examples
            '012345678905': { id: '12', name: 'Premium Coffee', price: 12.99, weight: 400, category: 'beverages', brand: 'Coffee Masters' },
            '012345678912': { id: '13', name: 'Organic Tea', price: 8.99, weight: 200, category: 'beverages', brand: 'Tea Garden' },
        };
        
        console.log('Node.js Barcode Scanner initialized');
        console.log('Product database loaded with', Object.keys(this.productDatabase).length, 'products');
    }
    
    async findBarcodeScanner() {
        try {
            const ports = await SerialPort.list();
            console.log('Available serial ports:', ports.map(p => `${p.path} (${p.manufacturer})`));
            
            // Look for common barcode scanner manufacturers/descriptions
            const scannerKeywords = ['barcode', 'scanner', 'symbol', 'honeywell', 'zebra', 'datalogic', 'usb'];
            
            for (const port of ports) {
                const description = (port.manufacturer || '') + ' ' + (port.serialNumber || '');
                const isScanner = scannerKeywords.some(keyword => 
                    description.toLowerCase().includes(keyword) ||
                    port.path.toLowerCase().includes('usb')
                );
                
                if (isScanner) {
                    console.log(`Potential barcode scanner found: ${port.path}`);
                    return port.path;
                }
            }
            
            // If no specific scanner found, try common paths
            const commonPaths = ['/dev/ttyUSB0', '/dev/ttyACM0', 'COM3', 'COM4', 'COM5'];
            for (const path of commonPaths) {
                try {
                    const testPort = new SerialPort({ path, baudRate: 9600, autoOpen: false });
                    await new Promise((resolve, reject) => {
                        testPort.open(err => {
                            if (err) reject(err);
                            else {
                                testPort.close();
                                resolve();
                            }
                        });
                    });
                    console.log(`Scanner found at: ${path}`);
                    return path;
                } catch (err) {
                    // Continue to next path
                }
            }
            
            throw new Error('No barcode scanner detected');
        } catch (error) {
            console.error('Error finding barcode scanner:', error.message);
            return null;
        }
    }
    
    async initializeScanner(portPath = null) {
        try {
            if (!portPath) {
                portPath = await this.findBarcodeScanner();
                if (!portPath) {
                    throw new Error('Could not find barcode scanner');
                }
            }
            
            console.log(`Connecting to barcode scanner at ${portPath}...`);
            
            this.port = new SerialPort({
                path: portPath,
                baudRate: 9600, // Common barcode scanner baud rate
                dataBits: 8,
                parity: 'none',
                stopBits: 1,
                autoOpen: false
            });
            
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\\r\\n' }));
            
            return new Promise((resolve, reject) => {
                this.port.open((err) => {
                    if (err) {
                        console.error('Error opening scanner port:', err.message);
                        reject(err);
                    } else {
                        console.log('✓ Barcode scanner connected successfully');
                        
                        // Set up data handler
                        this.parser.on('data', (data) => {
                            this.handleBarcodeData(data.trim());
                        });
                        
                        // Set up error handler
                        this.port.on('error', (err) => {
                            console.error('Scanner error:', err.message);
                        });
                        
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('Error initializing scanner:', error.message);
            throw error;
        }
    }
    
    handleBarcodeData(barcode) {
        if (!barcode || barcode.length < 8) {
            console.log('Invalid barcode data:', barcode);
            return;
        }
        
        console.log(`📊 Barcode scanned: ${barcode}`);
        
        // Check for recent scan to prevent duplicates
        if (this.isRecentScan(barcode)) {
            console.log('⚠️  Duplicate scan ignored (within cooldown period)');
            return;
        }
        
        // Look up product
        const product = this.lookupProduct(barcode);
        if (product) {
            console.log(`✓ Product found: ${product.name} - $${product.price}`);
            this.addToCart(product, barcode);
        } else {
            console.log(`⚠️  Unknown product for barcode: ${barcode}`);
            this.handleUnknownProduct(barcode);
        }
    }
    
    lookupProduct(barcode) {
        // Clean barcode (remove any prefixes/suffixes)
        const cleanBarcode = barcode.replace(/^[^0-9]*|[^0-9]*$/g, '');
        
        // Try exact match first
        let product = this.productDatabase[cleanBarcode];
        if (product) {
            return { ...product, barcode: cleanBarcode };
        }
        
        // Try original barcode
        product = this.productDatabase[barcode];
        if (product) {
            return { ...product, barcode };
        }
        
        // Try different barcode formats (UPC-A, EAN-13, etc.)
        const variations = [
            cleanBarcode.padStart(12, '0'), // UPC-A
            cleanBarcode.padStart(13, '0'), // EAN-13
            cleanBarcode.substring(1),      // Remove check digit
            cleanBarcode.substring(0, cleanBarcode.length - 1) // Remove last digit
        ];
        
        for (const variation of variations) {
            product = this.productDatabase[variation];
            if (product) {
                return { ...product, barcode: variation };
            }
        }
        
        return null;
    }
    
    isRecentScan(barcode) {
        const now = Date.now();
        
        // Clean up old entries
        for (const [code, timestamp] of this.recentScans.entries()) {
            if (now - timestamp > this.scanCooldown) {
                this.recentScans.delete(code);
            }
        }
        
        // Check if this barcode was recently scanned
        if (this.recentScans.has(barcode)) {
            return true;
        }
        
        // Add to recent scans
        this.recentScans.set(barcode, now);
        return false;
    }
    
    async addToCart(product, barcode, userId = 'demo_user') {
        try {
            const payload = {
                user_id: userId,
                product_id: product.id,
                quantity: 1,
                scan_type: 'barcode',
                scan_value: barcode,
                timestamp: Date.now() / 1000,
                product_name: product.name,
                product_price: product.price,
                product_weight: product.weight
            };
            
            console.log('🛒 Adding to cart:', payload);
            
            const response = await axios.post(this.apiEndpoint, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            
            if (response.status === 200) {
                console.log(`✓ Successfully added ${product.name} to cart`);
                this.indicateSuccess();
                return true;
            } else {
                console.error(`❌ Failed to add item to cart: ${response.status}`);
                this.indicateError();
                return false;
            }
        } catch (error) {
            console.error('❌ API request failed:', error.message);
            this.indicateError();
            return false;
        }
    }
    
    handleUnknownProduct(barcode) {
        console.log(`🔍 Attempting to add unknown product with barcode: ${barcode}`);
        
        // Create a generic product entry
        const unknownProduct = {
            id: `unknown_${barcode}`,
            name: `Unknown Product (${barcode})`,
            price: 0.99,
            weight: 100,
            category: 'unknown',
            brand: 'Unknown Brand',
            barcode: barcode
        };
        
        // Try to add to cart anyway
        this.addToCart(unknownProduct, barcode);
    }
    
    indicateSuccess() {
        console.log('🟢 SUCCESS: Item added to cart');
        // In a real implementation, this could trigger LEDs, buzzers, etc.
    }
    
    indicateError() {
        console.log('🔴 ERROR: Failed to add item');
        // In a real implementation, this could trigger error indicators
    }
    
    startScanning() {
        if (!this.port) {
            console.error('❌ Scanner not initialized');
            return;
        }
        
        console.log('🚀 Barcode scanner ready and listening...');
        console.log('💡 Scan a barcode to add products to your cart');
        this.running = true;
        
        // Keep the process alive
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down barcode scanner...');
            this.cleanup();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Terminating barcode scanner...');
            this.cleanup();
            process.exit(0);
        });
    }
    
    cleanup() {
        this.running = false;
        if (this.port && this.port.isOpen) {
            this.port.close((err) => {
                if (err) {
                    console.error('Error closing port:', err.message);
                } else {
                    console.log('✓ Scanner port closed');
                }
            });
        }
    }
}

// Main execution
async function main() {
    const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8000/api/cart/add-item';
    const PORT_PATH = process.env.SCANNER_PORT || null; // Let auto-detection work
    
    console.log('🚀 Starting Caper-style Barcode Scanner Integration');
    console.log('📡 API Endpoint:', API_ENDPOINT);
    
    const scanner = new NodeBarcodeScanner(API_ENDPOINT);
    
    try {
        await scanner.initializeScanner(PORT_PATH);
        scanner.startScanning();
    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if barcode scanner is connected via USB');
        console.log('2. Ensure scanner is configured for serial/keyboard emulation');
        console.log('3. Try different COM ports (Windows) or /dev/tty* (Linux/Mac)');
        console.log('4. Check scanner documentation for setup instructions');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = NodeBarcodeScanner;
