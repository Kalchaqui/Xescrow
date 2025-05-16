const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Xescrow - Mantle Test", function () {
  let xescrow, mockUSDC;
  let owner, client, provider;

  beforeEach(async function () {
    [owner, client, provider] = await ethers.getSigners();

    // 1. Desplegar MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy({ gasLimit: 3_000_000 });
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();

    // 2. Desplegar Xescrow con MockUSDC
    const Xescrow = await ethers.getContractFactory("Xescrow");
    xescrow = await Xescrow.deploy(mockUSDCAddress, { gasLimit: 3_000_000 });
    await xescrow.waitForDeployment();

    // 3. Transferir MockUSDC al cliente (1000 USDC con 6 decimales)
    const feeAmount = ethers.parseUnits("1000", 6);
    await mockUSDC.transfer(client.address, feeAmount);
  });

  // Test 1: Registro de usuarios
  it("1. Registro de usuarios como Cliente y Proveedor", async function () {
    // Registrar como Cliente
    await xescrow.connect(client).registerUser(1); // 1 = Client
    const clientUser = await xescrow.users(client.address);
    expect(clientUser.role).to.equal(1); // Client

    // Registrar como Proveedor
    await xescrow.connect(provider).registerUser(2); // 2 = Provider
    const providerUser = await xescrow.users(provider.address);
    expect(providerUser.role).to.equal(2); // Provider
  });

  // Test 2: Crear oferta
  it("2. Crear una oferta", async function () {
    await xescrow.connect(provider).registerUser(2); // Proveedor
    await xescrow.connect(provider).createServiceOffer("Servicio de diseño", ethers.parseUnits("100", 6));

    const offer = await xescrow.offers(0); // Primera oferta
    expect(offer.descriptionHash).to.equal("Servicio de diseño");
    expect(offer.price).to.equal(ethers.parseUnits("100", 6));
    expect(offer.status).to.equal(0); // OfferStatus.Open
  });

  // Test 3: Aceptar oferta
  it("3. Aceptar una oferta", async function () {
    await xescrow.connect(provider).registerUser(2); // Proveedor
    await xescrow.connect(provider).createServiceOffer("Servicio de prueba", ethers.parseUnits("100", 6));

    await xescrow.connect(client).registerUser(1); // Cliente
    const fee = (ethers.parseUnits("100", 6) * 2n) / 100n; // 2% fee
    const totalAmount = ethers.parseUnits("100", 6) + fee;

    // Aprobar y aceptar oferta
    await mockUSDC.connect(client).approve(xescrow.target, totalAmount);
    await xescrow.connect(client).acceptOffer(0);

    const offer = await xescrow.offers(0);
    expect(offer.client).to.equal(client.address);
    expect(offer.status).to.equal(1); // OfferStatus.Accepted
  });

  // Test 4: Confirmar entrega
  it("4. Confirmar entrega y retirar fondos", async function () {
    await xescrow.connect(provider).registerUser(2);
    await xescrow.connect(provider).createServiceOffer("Servicio de diseño", ethers.parseUnits("100", 6));

    await xescrow.connect(client).registerUser(1);
    const fee = (ethers.parseUnits("100", 6) * 2n) / 100n;
    const totalAmount = ethers.parseUnits("100", 6) + fee;

    await mockUSDC.connect(client).approve(xescrow.target, totalAmount);
    await xescrow.connect(client).acceptOffer(0);
    await xescrow.connect(client).confirmDelivery(0);

    const providerInitialBalance = await mockUSDC.balanceOf(provider.address);
    await xescrow.connect(provider).withdrawFunds(); // Retirar fondos
    const providerFinalBalance = await mockUSDC.balanceOf(provider.address);

    expect(providerFinalBalance).to.equal(providerInitialBalance + ethers.parseUnits("100", 6));
  });

  // Test 5: Retirar tarifas de plataforma
  it("5. Retirar tarifas de plataforma", async function () {
    await xescrow.connect(provider).registerUser(2);
    await xescrow.connect(provider).createServiceOffer("Servicio", ethers.parseUnits("100", 6));
    await xescrow.connect(client).registerUser(1);

    const fee = (ethers.parseUnits("100", 6) * 2n) / 100n;
    const totalAmount = ethers.parseUnits("100", 6) + fee;

    await mockUSDC.connect(client).approve(xescrow.target, totalAmount);
    await xescrow.connect(client).acceptOffer(0);
    await xescrow.connect(client).confirmDelivery(0);

    // El owner retira tarifas
    const ownerInitialBalance = await mockUSDC.balanceOf(owner.address);
    await xescrow.connect(owner).withdrawPlatformFees(owner.address);
    const ownerFinalBalance = await mockUSDC.balanceOf(owner.address);

    expect(ownerFinalBalance).to.be.gt(ownerInitialBalance);
  });
});