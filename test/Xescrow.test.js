const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Xescrow - Mantle Test", function () {
  let xescrow;
  let owner, client, provider;

  beforeEach(async function () {
    [owner, client, provider] = await ethers.getSigners();

    // Desplegar Xescrow (sin parámetros, ya que no usa MockUSDC)
    const Xescrow = await ethers.getContractFactory("Xescrow");
    xescrow = await Xescrow.deploy();
    await xescrow.waitForDeployment();
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
    const price = ethers.parseEther("100"); // Precio en MNT
    await xescrow.connect(provider).createServiceOffer("Servicio de diseño", price);

    const offer = await xescrow.offers(0); // Primera oferta
    expect(offer.descriptionHash).to.equal("Servicio de diseño");
    expect(offer.price).to.equal(price);
    expect(offer.status).to.equal(0); // OfferStatus.Open
  });

  // Test 3: Aceptar oferta
  it("3. Aceptar una oferta", async function () {
    await xescrow.connect(provider).registerUser(2); // Proveedor
    const price = ethers.parseEther("100");
    await xescrow.connect(provider).createServiceOffer("Servicio de prueba", price);

    await xescrow.connect(client).registerUser(1); // Cliente
    const fee = (price * 2n) / 100n; // 2% fee
    const totalAmount = price + fee;

    // Aceptar oferta enviando MNT
    await xescrow.connect(client).acceptOffer(0, { value: totalAmount });

    const offer = await xescrow.offers(0);
    expect(offer.client).to.equal(client.address);
    expect(offer.status).to.equal(1); // OfferStatus.Accepted
  });

  // Test 4: Confirmar entrega
  it("4. Confirmar entrega y retirar fondos", async function () {
    await xescrow.connect(provider).registerUser(2);
    const price = ethers.parseEther("100");
    await xescrow.connect(provider).createServiceOffer("Servicio de diseño", price);

    await xescrow.connect(client).registerUser(1);
    const fee = (price * 2n) / 100n;
    const totalAmount = price + fee;

    await xescrow.connect(client).acceptOffer(0, { value: totalAmount });
    await xescrow.connect(client).confirmDelivery(0);

    const providerInitialBalance = await ethers.provider.getBalance(provider.address);
    await xescrow.connect(provider).withdrawFunds(); // Retirar fondos
    const providerFinalBalance = await ethers.provider.getBalance(provider.address);

    expect(providerFinalBalance).to.be.gt(providerInitialBalance);
  });

  // Test 5: Retirar tarifas de plataforma
  it("5. Retirar tarifas de plataforma", async function () {
    await xescrow.connect(provider).registerUser(2);
    const price = ethers.parseEther("100");
    await xescrow.connect(provider).createServiceOffer("Servicio", price);
    await xescrow.connect(client).registerUser(1);

    const fee = (price * 2n) / 100n;
    const totalAmount = price + fee;

    await xescrow.connect(client).acceptOffer(0, { value: totalAmount });
    await xescrow.connect(client).confirmDelivery(0);

    // El owner retira tarifas
    const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
    await xescrow.connect(owner).withdrawPlatformFees(owner.address);
    const ownerFinalBalance = await ethers.provider.getBalance(owner.address);

    expect(ownerFinalBalance).to.be.gt(ownerInitialBalance);
  });
});