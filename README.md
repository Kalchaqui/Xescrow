

![alt text](image-3.png)

Se creo Xescrow como una plataforma descentralizada para contratar y asegurar servicios laborales entre clientes y proveedores, utilizando tokens ERC-20 (como USDC) en la red Mantle Sepolia para el hackathon de Odisea Nucleo, como es una beta experimental y comienzo del proyecto final se reducieron a algunas funciones el smart contract. Xescrow Buscará solucionar un problema real como la falta de confianza, pagos no garantizados y la dependencia de intermediarios.





![alt text](image.png)



📦 Para ejecutar el proyecto:
*******************************

npm install del lado de front como en la raíz

npm run dev

Aclaración, el front-end te permitirá:

-Registro de usuarios como Cliente o Proveedor
-Creación de ofertas laborales con descripción IPFS
-Aceptación de ofertas con pago en token (simula USDC)
-Confirmación de entrega y retiro de fondos
-Retiro de tarifas acumuladas por la plataforma


✅  Verificación de Smart contract Xescrow
*******************************

https://sepolia.mantlescan.xyz/address/0x518473adD009632e8Ce711a1861424dab03B5d29#code


✅ Test
*******************************

 ![Alt Text](./image-1.jpg)


✅ Deploy
*******************************

![alt text](image-2.png)


🛠️ Tecnologías usadas
*******************************
Contrato inteligente : Solidity + OpenZeppelin
Testing : Hardhat
Frontend : Next.js + Privy 
Auditoria: NatSpect format 
Token simulado : MockUSDC.sol (ERC20 con 6 decimales)



Autores
*******************************
Braulio Chávez
Diego Raúl Barrionuevo


Agradecimientos
*******************************
A Rafa por el compromiso como profesor y las sesiones dedicadas a dudas planteadas en el trabajo
Al equipo de Odisea Nucleo por hacer posible este evento.
