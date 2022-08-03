const { extractURLFromRequestMessage, checkContractHash } = require("./index");

const defaultLogger = console;

describe("Request Message Extraction", () => {
  test("single value", () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
https://example.com/78e6bf906d2586f00a9a6d945caef729272daf7c5de7c96631590821c7889abb`;
    const result = extractURLFromRequestMessage(message);
    expect(result.length).toBe(1);
    expect(result[0]).toBe("https://example.com/78e6bf906d2586f00a9a6d945caef729272daf7c5de7c96631590821c7889abb");
  });
  test("multiple value", () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคารเกียรตินาคินภัทร จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่

https://example.com/78e6bf906d2586f00a9a6d945caef729272daf7c5de7c96631590821c7889abb
    
https://example.com/46eca8c06c993311439151404d2360ded2322c3dbbe49d91d6e9330ed78c6260
    
https://example.com/18c3ffddedab9a36f5300db4c597b2a88e35693f178820e2123941d674c4f480
    
    
    
    `;
    const result = extractURLFromRequestMessage(message);
    expect(result.length).toBe(3);
    expect(result[0]).toBe("https://example.com/78e6bf906d2586f00a9a6d945caef729272daf7c5de7c96631590821c7889abb");
    expect(result[1]).toBe("https://example.com/46eca8c06c993311439151404d2360ded2322c3dbbe49d91d6e9330ed78c6260");
    expect(result[2]).toBe("https://example.com/18c3ffddedab9a36f5300db4c597b2a88e35693f178820e2123941d674c4f480");
  });

  test("invalid value: without http", () => {
    const message = ": ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร ฺB จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่";
    const result = extractURLFromRequestMessage(message);
    expect(result.length).toBe(0);
  });

  test("invalid value: hacker message", () => {
    const message = "ยินดีด้วยคะ เงินเดือนของคุณ 20,000 บาท เข้าบัญชียูสเซอร์ของคุณแล้วเสร็จงานภารกิจถอนเงินสดเข้าบัญชีได้ทันที กรุณากดที่ http://tinyurl/xxxx";
    const result = extractURLFromRequestMessage(message);
    expect(result.length).toBe(0);
  });

  test("invalid value: empty message", () => {
    const message = "";
    const result = extractURLFromRequestMessage(message);
    expect(result.length).toBe(0);
  });

  test("invalid value: non-string", () => {
    const message = false;
    const result = extractURLFromRequestMessage(message);
    expect(result.length).toBe(0);
  });
});

describe("Validate Request Message", () => {
  test("one constract", async () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
http://localhost:3010/file/26ac627c6f6094bfa7e19f970d9a53b0d881c663f577b3128abbc758357f01de`;
    const result = await checkContractHash(message);
    expect(result).toBe(true);
  });

  test("multiple contracts", async () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
http://localhost:3010/file/26ac627c6f6094bfa7e19f970d9a53b0d881c663f577b3128abbc758357f01de
http://localhost:3010/file/91dfaf06e775e56cab617dad70bea5076bdc044b828820d760d9f32d37ccf283
http://localhost:3010/file/c06b69615a2bdaa1a0d486a4634ba5400275d25290deb6681bed29def7e5cc48
  `;
    const result = await checkContractHash(message);
    expect(result).toBe(true);
  });

  test("URL Not found", async () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
http://localhost:3010/file/26ac627c6f6094bfa7e19f97`;
    const result = await checkContractHash(message, { logger: defaultLogger });
    expect(result).toBe(false);
  });

  test("Invalid Hash Message", async () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
http://localhost:3010/file/26ac627c6f6094bfa7e19f970d9a53b0d881c663f577b3128abbc758357f01ff`;
    const result = await checkContractHash(message);
    expect(result).toBe(false);
  });

  test("Invalid format request message", async () => {
    const message = "ยินดีด้วยคะ เงินเดือนของคุณ 20,000 บาท เข้าบัญชียูสเซอร์ของคุณแล้วเสร็จงานภารกิจถอนเงินสดเข้าบัญชีได้ทันที กรุณากดที่ http://tinyurl/xxxx";
    const result = await checkContractHash(message);
    // console.log(result)
    expect(result).toBe(false);
  });

  test("Host not found", async () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
http://localhost23:3010/file/26ac627c6f6094bfa7e19f970d9a53b0d881c663f577b3128abbc758357f01ff`;
    const result = await checkContractHash(message, { logger: defaultLogger });
    expect(result).toBe(false);
  });

  test("Host timeout", async () => {
    const message = `: ท่านกำลังยืนยันตัวตนและลงนามสัญญาด้วยลายมือชื่ออิเล็กทรอนิกส์ [ธนาคาร B จำกัด (มหาชน)] ที่ท่านเลือก (Ref:477701) สามารถอ่านสัญญาได้ที่
http://localhost:3011/file/26ac627c6f6094bfa7e19f970d9a53b0d881c663f577b3128abbc758357f01ff`;
    const result = await checkContractHash(message, { logger: defaultLogger });
    expect(result).toBe(false);
  });
});
