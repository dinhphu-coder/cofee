import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== MỘC COFFEE — ĐỒNG BỘ VECTOR AI LÊN CLOUDFLARE VECTORIZE ===');

// Các chủ đề ngữ nghĩa tiếng Việt để sinh vector chuẩn 1024D
const VIETNAMESE_FEATURE_GROUPS = [
  ['đậm', 'mạnh', 'phin', 'sữa đá', 'đen đá', 'robusta', 'buôn ma thuột', 'đắk lắk', 'tỉnh táo', 'không chua', 'sô-cô-la'],
  ['chua thanh', 'thơm', 'hoa quả', 'trái cây', 'arabica', 'cầu đất', 'đà lạt', 'sơn la', 'ít cafein', 'say cà phê', 'nhẹ nhàng', 'mật ong'],
  ['pha máy', 'espresso', 'latte', 'cappuccino', 'americano', 'crema', 'hạt phỉ', 'cacao', 'văn phòng'],
  ['cold brew', 'ủ lạnh', 'v60', 'pour over', 'giấy lọc', 'chemex', 'french press', 'cam vàng', 'mơ chín'],
  ['quà tặng', 'hộp quà', 'biếu', 'đối tác', 'lễ tết', 'set quà', 'tinh hoa'],
  ['cách pha', 'hướng dẫn', 'công thức', 'tỷ lệ', 'nhiệt độ', 'blooming', 'chiết xuất'],
  ['bảo quản', 'giữ hương', 'tủ lạnh', 'khóa zip', 'van 1 chiều', 'hạn sử dụng'],
  ['giao hàng', 'vận chuyển', 'phí ship', 'freeship', 'miễn phí', 'bao lâu', 'cod', 'thanh toán', 'chuyển khoản'],
  ['đổi trả', 'hoàn tiền', 'rách', 'hở van', 'hủy đơn', 'bảo mật', 'quyền lợi', 'đồng kiểm'],
  ['lợi thế', 'rang mộc', 'nguyên chất', 'không tẩm', 'bơ', 'hóa chất', 'nguồn gốc', 'nông trại', 'liên hệ', 'hotline', 'địa chỉ'],
];

function computeVector1024(text) {
  const dims = 1024;
  const vec = new Array(dims).fill(0);
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Phân bổ chủ đề vào các chiều đầu
  VIETNAMESE_FEATURE_GROUPS.forEach((group, gIdx) => {
    for (const kw of group) {
      if (normalized.includes(kw)) {
        vec[gIdx * 2] += 2.5;
        vec[gIdx * 2 + 1] += 1.8;
      }
    }
  });

  // 2. Hash từ vựng (Unigram & Bigram) vào các chiều còn lại
  const tokens = normalized.split(' ').filter((t) => t.length > 1);
  for (let i = 0; i < tokens.length; i++) {
    const uni = tokens[i];
    let h1 = 2166136261;
    for (let c = 0; c < uni.length; c++) {
      h1 ^= uni.charCodeAt(c);
      h1 = Math.imul(h1, 16777619);
    }
    const idx1 = 20 + (Math.abs(h1) % (dims - 20));
    vec[idx1] += 1.0;

    if (i < tokens.length - 1) {
      const bi = `${tokens[i]}_${tokens[i + 1]}`;
      let h2 = 2166136261;
      for (let c = 0; c < bi.length; c++) {
        h2 ^= bi.charCodeAt(c);
        h2 = Math.imul(h2, 16777619);
      }
      const idx2 = 20 + (Math.abs(h2) % (dims - 20));
      vec[idx2] += 1.5;
    }
  }

  // Chuẩn hóa L2 norm
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => Number((v / norm).toFixed(5)));
}

// 18 tài liệu tri thức & sản phẩm của MỘC Coffee
const knowledgeItems = [
  {
    id: 'kb-brand-identity-p1',
    category: 'brand',
    title: 'Thông tin thương hiệu, địa chỉ & liên hệ MỘC Coffee',
    text: 'Thương hiệu MỘC Coffee slogan Hương Vị Việt. Đánh Thức Đam Mê. Hạt Mộc - Vị Nguyên Bản - Tâm Người Việt. Xưởng rang TP Buôn Ma Thuột Đắk Lắk, Showroom Quận 1 TPHCM số 86 Nguyễn Huệ. Hotline 1900 6868 Zalo 0901 234 567 email hello@moccoffee.vn.',
  },
  {
    id: 'kb-advantages-p1',
    category: 'advantage',
    title: 'Lợi thế cạnh tranh & Giá trị cốt lõi MỘC Coffee',
    text: '5 lợi thế MỘC Coffee: 100% Rang Mộc Nguyên Bản không tẩm bơ bắp hóa chất, nguồn gốc trái chín đỏ Buôn Ma Thuột Cầu Đất, rang mẻ nhỏ small-batch, bao bì giấy Kraft van 1 chiều bảo quản 45 ngày, xay miễn phí 5 cấp độ chuẩn Barista.',
  },
  {
    id: 'kb-customer-benefits-p1',
    category: 'benefit',
    title: 'Quyền lợi khách hàng tại MỘC Coffee',
    text: 'Quyền lợi khách hàng: Miễn phí xay 5 cấp độ phin máy pour over cold brew; Đồng kiểm khi nhận COD; Freeship toàn quốc từ 500k; Đổi mới 100% miễn phí trong 7 ngày nếu lỗi rách van; Tài khoản thành viên đồng bộ đơn theo SĐT.',
  },
  {
    id: 'kb-policy-shipping-payment-p1',
    category: 'policy',
    title: 'Chính sách Giao hàng, Phí vận chuyển & Thanh toán',
    text: 'Giao hàng toàn quốc 63 tỉnh thành. Nội thành TPHCM Hà Nội 1-2 ngày, tỉnh khác 2-4 ngày. Phí ship 30.000đ, miễn phí từ 500.000đ. Thanh toán COD tiền mặt đồng kiểm hoặc chuyển khoản ngân hàng.',
  },
  {
    id: 'kb-policy-return-privacy-p1',
    category: 'policy',
    title: 'Chính sách Đổi trả, Hủy đơn & Bảo mật',
    text: 'Đổi mới 100% trong 7 ngày miễn phí nếu rách bao bì sai loại hạt. Tự hủy đơn online khi trạng thái pending tự hoàn kho. Bảo mật thông tin mã hóa SĐT an toàn trên Cloudflare D1.',
  },
  {
    id: 'kb-brewing-phin-p1',
    category: 'brewing',
    title: 'Hướng dẫn công thức pha Cà phê Phin truyền thống',
    text: 'Công thức pha Phin ngon: Dùng 25g cà phê Robusta hoặc Blend Phin, tráng nóng phin nhôm, ủ blooming 20-30ml nước sôi 93 độ trong 1-2 phút, châm tiếp 50-60ml nước sôi nhỏ giọt từ từ, thêm sữa đặc đá.',
    product_slug: 'blend-phin-viet',
  },
  {
    id: 'kb-brewing-espresso-coldbrew-p1',
    category: 'brewing',
    title: 'Hướng dẫn pha Espresso & Cold Brew thanh mát',
    text: 'Espresso: Dùng 18-20g cỡ xay mịn chiết xuất 36-40g trong 25-30 giây lớp crema nâu vàng dày. Cold Brew: Tỷ lệ 1:8 hoặc 1:10 cà phê Arabica Cầu Đất ủ lạnh ngăn mát tủ lạnh 16-24 tiếng lọc bã thêm cam lát.',
    product_slug: 'arabica-cau-dat',
  },
  {
    id: 'kb-faq-origin-roast-level-p1',
    category: 'faq',
    title: 'Giải đáp thắc mắc hạt rang mộc và mức độ rang',
    text: 'Cà phê rang mộc không bóng dầu nhẫy như tẩm bơ, nước pha màu nâu cánh gián hổ phách trong trẻo không đen kịt đặc quánh. Mức rang vừa Medium giữ hậu ngọt và hương hoa quả, Dark roast đậm đà cho phin sữa đá.',
  },
  {
    id: 'kb-faq-preservation-grind-p1',
    category: 'faq',
    title: 'Cách bảo quản cà phê và chọn cỡ xay phù hợp',
    text: 'Bảo quản nơi khô ráo thoáng mát miết chặt khóa zip van 1 chiều không để ngăn đá tủ lạnh. Cỡ xay: Nguyên hạt để tự xay; Xay Phin hạt mịn như muối tinh; Xay Máy Espresso mịn; Pour Over vừa; Cold Brew thô.',
  },
  {
    id: 'prod-robusta-buon-ma-thuot-p1',
    category: 'product',
    title: 'Cà phê Robusta Mộc Sẻ Buôn Ma Thuột (145.000đ)',
    text: 'Sản phẩm Robusta Mộc Sẻ Buôn Ma Thuột Đắk Lắk gói 500g giá 145.000đ. Rang vừa đậm Medium-Dark, sơ chế Natural phơi giàn. Hương vị đậm đà đắng êm socola đen hạt dẻ hậu ngọt sâu, hàm lượng cafein cao tỉnh táo.',
    product_slug: 'robusta-buon-ma-thuot',
  },
  {
    id: 'prod-arabica-cau-dat-p1',
    category: 'product',
    title: 'Cà phê Arabica Cầu Đất Đà Lạt Specialty (195.000đ)',
    text: 'Sản phẩm Arabica Cầu Đất Đà Lạt Lâm Đồng độ cao 1500m gói 250g giá 195.000đ. Rang vừa Medium sơ chế Washed ướt. Hương hoa nhài cam vàng chanh tươi mật ong chua thanh êm hậu ngọt sâu quyến rũ không say.',
    product_slug: 'arabica-cau-dat',
  },
  {
    id: 'prod-blend-phin-viet-p1',
    category: 'product',
    title: 'Cà phê Phối Trộn Blend Phin Việt (165.000đ)',
    text: 'Sản phẩm Blend Phin Việt tỷ lệ vàng 70% Robusta Đắk Lắk và 30% Arabica Cầu Đất gói 500g giá 165.000đ. Rang vừa đậm cân bằng hoàn hảo giữa đậm đà sánh ngậy và hương thơm thanh thoát, chuyên cho cà phê sữa đá phin.',
    product_slug: 'blend-phin-viet',
  },
  {
    id: 'prod-espresso-crema-blend-p1',
    category: 'product',
    title: 'Cà phê Espresso Crema Blend Pha Máy (210.000đ)',
    text: 'Sản phẩm Espresso Crema Blend 60% Arabica Cầu Đất và 40% Robusta Sẻ gói 500g giá 210.000đ. Rang Medium cho máy pha Espresso gia đình quán cafe, lớp crema dày mịn màu hạt phỉ caramel béo ngậy.',
    product_slug: 'espresso-crema-blend',
  },
  {
    id: 'prod-culi-dak-lak-p1',
    category: 'product',
    title: 'Cà phê Culi Đắk Lắk Đậm Đà Nhân Đơn (155.000đ)',
    text: 'Sản phẩm Culi Robusta Đắk Lắk hạt tròn một nhân gói 500g giá 155.000đ. Rang đậm Dark roast đắng mạnh mẽ cá tính thể chất dày dặn cho người gu cà phê cực đậm.',
    product_slug: 'culi-dak-lak',
  },
  {
    id: 'prod-arabica-son-la-natural-p1',
    category: 'product',
    title: 'Cà phê Arabica Sơn La Natural Vùng Tây Bắc (225.000đ)',
    text: 'Sản phẩm Arabica Mường Chanh Sơn La gói 250g giá 225.000đ. Rang Light-Medium sơ chế Natural lên men tự nhiên. Hương mận chín mơ rừng thảo mộc ngọt thanh tao độc đáo.',
    product_slug: 'arabica-son-la-natural',
  },
  {
    id: 'prod-cold-brew-blend-p1',
    category: 'product',
    title: 'Cà phê Cold Brew Blend Trái Cây Nhiệt Đới (185.000đ)',
    text: 'Sản phẩm Cold Brew Blend chuyên ủ lạnh 100% Arabica Cầu Đất và Sơn La gói 250g giá 185.000đ. Xay thô chuyên dụng không cặn, hương cam bergamot dâu tây mật ong thanh mát giải nhiệt.',
    product_slug: 'cold-brew-blend',
  },
  {
    id: 'prod-hop-qua-tinh-hoa-p1',
    category: 'product',
    title: 'Hộp Quà Cà Phê Tinh Hoa MỘC Gift Set (380.000đ)',
    text: 'Hộp Quà Tặng Tinh Hoa MỘC gồm 1 hũ Arabica Cầu Đất 250g, 1 hũ Blend Phin Việt 250g và 1 Phin nhôm Anode khắc laser cao cấp giá 380.000đ sang trọng biếu tặng.',
    product_slug: 'hop-qua-tinh-hoa',
  },
];

console.log(`Đang sinh ${knowledgeItems.length} vectors 1024 chiều...`);

const ndjsonLines = knowledgeItems.map((item) => {
  const fullText = `${item.title} ${item.text}`;
  const values = computeVector1024(fullText);
  const record = {
    id: item.id,
    values,
    metadata: {
      category: item.category,
      title: item.title,
      content: item.text.slice(0, 480),
      product_slug: item.product_slug || '',
    },
  };
  return JSON.stringify(record);
});

const tempFile = path.resolve(__dirname, '../vectors.ndjson');
fs.writeFileSync(tempFile, ndjsonLines.join('\n') + '\n', 'utf8');
console.log(`Đã tạo tệp vectors.ndjson (${(fs.statSync(tempFile).size / 1024).toFixed(1)} KB)`);

console.log('Đang nạp vectors vào Cloudflare Vectorize Index "moc-coffee-vector-index"...');
try {
  execSync(`npx wrangler vectorize insert moc-coffee-vector-index --file="${tempFile}"`, {
    stdio: 'inherit',
  });
  console.log('✅ Đã nạp thành công toàn bộ Vectors vào Cloudflare Vectorize!');
} catch (err) {
  console.error('Lỗi khi nạp vectors vào Vectorize:', err.message);
} finally {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}

