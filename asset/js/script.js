// bắt buộc
import * as THREE from "./three.module.js";
import { GLTFLoader } from "./GLTFLoader.js";
// import { BufferGeometryUtils } from "./jsm/utils/BufferGeometryUtils.js"; // nếu cần
// tạo scene và camera 3d
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c1a);
const camera = new THREE.PerspectiveCamera(
  75, // đây là góc nhìn từ cammera càng lớn càng rộng
  window.innerWidth / window.innerHeight, //tỉ lệ khung hình theo kích thước của sổ
  0.1, //khoảng cách gần nhất mà camera có thể thấy
  1000 // khoảng cách xa nhất mà camera có thể thấy
);
// nói chung đây là hàm tạo ra góc nhìn qua cam

// tạo biến để renderer lên canva
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("bg"),
});

// renderer với hình ảnh rõ nét
renderer.setPixelRatio(window.devicePixelRatio);
// quy định kích thước của phạm vi renderer là toàn màng hình
renderer.setSize(window.innerWidth, window.innerHeight);
// đặt camera ở trục z thục lùi lại 20 đơn vị
camera.position.setZ(20);

// hiệu ứng ánh sáng
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // ánh sáng dịu chiếu đều toàn bộ không bóng đỗ
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1); // ánh sáng chính ánh sãng điểm tạo hiệu ứng bóng nhưng không chiếu toàn bộ
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// item

const stars = []; // Danh sách các sao

function addStar() {
  // tạo hình dạng ngôi sao
  const geometry = new THREE.SphereGeometry(0.5, 40, 40);
  //   tạo màu sắc cho sao
  const material = new THREE.MeshStandardMaterial({
    emissive: 0xffffff, // màu phát sáng không phụ thuộc vào ánh sáng pointlight
    emissiveIntensity: 0.5, // cường độ ánh sáng
  });
  // kết hợp hình dạng và màu sắc gốc của ngôi sao
  const star = new THREE.Mesh(geometry, material);
  // tạo vị trí xuất hiện cho các ngôi sao
  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(1000));
  star.position.set(x, y, z);
  scene.add(star);

  // Thêm vào mảng sao kèm tốc độ & pha riêng
  stars.push({
    mesh: star,
    speed: Math.random() * 5 + 2, // tốc độ dao động từ 2 → 7
    phase: Math.random() * Math.PI * 2, // pha khởi đầu ngẫu nhiên
    floatSpeed: Math.random() * 0.005 + 0.002, // tốc độ bay
  });
}
let model;
let modelGroup = new THREE.Group(); // Nhóm để kiểm soát xoay và scale
// thêm khối chứa group vào scene
scene.add(modelGroup);

// tải mô hình người
const loader = new GLTFLoader();
loader.load(
  "asset/models/man_in_suit.glb",
  (gltf) => {
    // gán model là mô hình gốc
    model = gltf.scene;
    // mức độ phóng to của model
    model.scale.set(0.1, 0.1, 0.1);
    // vị trí của model
    model.position.set(0, -10, 0);
    // vị trí của camera
    camera.position.set(0, 0, 25);

    //Chuyển toàn bộ mesh về material chuẩn
    model.traverse((child) => {
      // kiểm tra xem child có phải là 1 mesh không nếu phải gán lại thuộc tính materal thành kiêm loại chẩn
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff, // màu sắc
          metalness: 0.2, // tính kiêm loại
          roughness: 0.7, // độ nhám
        });
      }
    });
    // thêm model và modelgroup
    modelGroup.add(model);
  },
  //nếu child không thuộc danh sách mesh thì sẽ xuất biên rỗng
  undefined,
  // nếu lỗi thì sẽ thông báo
  (error) => {
    console.error(" Lỗi khi tải mô hình:", error);
  }
);
// biến xoay
let scrolly = 0;
//   mô hình người xoay theo Scroll
window.addEventListener("scroll", () => {
  // gán biến xoay gắn liền với hành động lăn chuột
  scrolly = window.scrollY;
});
// giá trị phóng to mô hình
let scalevalue = 0;
const maxScrollSpin = 1400;
const ROTATION_SPEED = (2 * Math.PI) / maxScrollSpin;
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.002; // thời gian chung

  stars.forEach(({ mesh, speed, phase }) => {
    // Tính cường độ phát sáng theo hàm sin với 0.4 là cường độ thấp nhất và 0.6 là cường độ tăng thêm
    const intensity = 0.4 + 0.6 * Math.abs(Math.sin(time * speed + phase));
    // gán lại cường độ phát sáng cho sao
    mesh.material.emissiveIntensity = intensity;
    // sao di chuyển nhẹ sang phải theo thời gian
    mesh.position.x += 0.05;

    // nếu trôi quá xa thì reset về trái
    if (mesh.position.x > 200) {
      mesh.position.x = -200;
    }
  });
  // kiểm tra modelgroup có tồn tại không
  if (modelGroup) {
    const scroll = Math.min(window.scrollY, maxScrollSpin);
    const currentRotation = scroll * ROTATION_SPEED;
    modelGroup.rotation.y = currentRotation;

    // Scale vẫn tăng như bình thường (hoặc bạn có thể cố định luôn)
    scalevalue = 1 + scroll * 0.001; // scale nhẹ hơn
    // quy định giá trị phóng to không quá 2.5
    scalevalue = Math.min(scalevalue, 2.5);
    modelGroup.scale.set(scalevalue, scalevalue, scalevalue);

    let modelOffsetY = 0;

    if (model) {
      if (window.scrollY > maxScrollSpin) {
        const extra = window.scrollY - maxScrollSpin;
        modelOffsetY = -extra * 0.05; // điều chỉnh tốc độ trượt
      } else {
        modelOffsetY = 0;
      }

      // Vị trí model trong group thay đổi, còn group giữ nguyên
      model.position.set(0, -10 + modelOffsetY, 0);
    }
  }
  // vẽ lại scene
  renderer.render(scene, camera);
}

// hàm hiện thẻ thông tin khi mép trên của phần tử đến giữa màng hình và ẩn khi ra khỏi màng hình
function checkInfoBoxVisible(element) {
  // gán thuộc tính giá trị của infoBox vào rect
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  // Khi mép trên info-box chạm đến giữa màn hình
  if (rect.top <= windowHeight / 2) {
    // thêm class visible vào infoBox
    element.classList.add("visible");
  } else {
    // xóa class visible ra khỏi infoBox
    element.classList.remove("visible");
  }
}

const elementsToCheck = document.querySelectorAll(
  ".info-box, .lovely-box, .work-box, .skill-container, .award-container, .project-node"
);

function checkAllBoxesVisible() {
  elementsToCheck.forEach((el) => checkInfoBoxVisible(el));
}

// hàm cho phép xoay khối skill theo chuột
document.addEventListener("mousemove", (e) => {
  const deck = document.querySelector(".skill-container");
  const x = (e.clientX / window.innerWidth - 0.5) * 30;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;
  deck.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
});

// khi window có hành động scroll thì dùng hàm checkInfoBoxVisible
window.addEventListener("scroll", checkAllBoxesVisible);
// khi window có hành động load thì dùng hàm checkInfoBoxVisible
window.addEventListener("load", checkAllBoxesVisible);

Array(400).fill().forEach(addStar); //gọi hàm add star 400 lần
animate(); // bắt đầu gọi hàm
