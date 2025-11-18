import { ethers } from 'ethers';

export const provider = new ethers.WebSocketProvider(
    'wss://ws.coredao.org',
    undefined,
    {
        staticNetwork: true,
    }
);
