import axios from 'axios';

export async function getPublicIPv6() {
    try {
        // This service returns your public IPv6 address as plain text
        const response = await axios.get('https://api64.ipify.org?format=json');
        // Example response: { ip: "2601:abcd:1234:5678::1" }
        return response.data.ip;
    } catch (error) {
        console.error('Failed to get public IPv6 address:', error);
        return null;
    }
}