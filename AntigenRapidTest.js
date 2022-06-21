const InfoContainer = document.querySelector(".info-container")
const citySelector = document.querySelector(".city-selector")
const BtnEnter = document.querySelector(".BtnEnter")
const TablePanel = document.querySelector(".TablePanel")
const MapID = document.querySelector("#map")

const countyID = document.querySelector('#county-id')
const districtID = document.querySelector('#district-id')
const tbody = document.querySelector("tbody")
let table = document.querySelector("table")

let stores = []; //放入全國販賣快篩試劑的店名

function createStoreInformation(storeArray) {
  stores = storeArray.map((event) => {
    const singleKey = event.split(",")
    let store = {
      ID: singleKey[0],
      Name: singleKey[1],
      Address: singleKey[2],
      Lon: singleKey[3],
      Lat: singleKey[4],
      phone: singleKey[5],
      brand: singleKey[6],
      amount: singleKey[7],
      Time: singleKey[8],
      Note: singleKey[9]
    }
    return store
  })
  stores.pop() //疑似最後還有一行空白的
  stores.shift() //把表頭移除
  console.log(stores)
}

// 套件:tw-city-selector
//https://dennykuo.github.io/tw-city-selector/#/
new TwCitySelector({
  el: ".city-selector",
  elCounty: ".county", // 在 el 裡查找 element
  elDistrict: ".district", // 在 el 裡查找 element
  elBtn: ".BtnEnter",
  el: ".city-selector-standard-words",
  standardWords: true
  // countyValue: "臺北市" // 此處需用正體字的臺
})

//下拉式清單選完後，列出縣市及區域皆符合的藥局
function FindLocation(AddressInput) {
  let searchStore = [] //放入下拉式清單選擇後的店名
  const county = countyID.value
  const District = districtID.value
  
  //將地址拿來跟county&District做比較
  searchStore = stores.filter((store)=>
    store.Address.includes(county) && store.Address.includes(District)  
  )
  return searchStore
}

// 查找到的店舖都render上去
function createStoreTable(Stores) {
  tbody.innerHTML = Stores.map(store =>
    `
  <tr data-id="${store["ID"]}">
    <td headers="name" rowspan="2">${store["Name"]}</td>
    <td headers="amount" rowspan="2">${store["amount"]}</td>
    <td headers="Address&note">${store["Address"]}</td>           
    <td headers="phone" rowspan="2">${store["phone"]}</td>  
    <td headers="brand&map" rowspan="2"><button class="GoogleMapModal" data-bs-toggle="modal" data-bs-target="#map-Modal" data-id="${store["ID"]}">click</button></td>
    </tr>
    <tr data-id="${store["ID"]}"><td headers="Address&note" class="note">備註:${store["Note"]}</td></tr>
    `
  ).join('')
}

function SearchStoreList(event) {
  const SelectCounty = countyID.value
  const SelectDistrict = districtID.value

  if (SelectCounty.length === 0 || SelectDistrict.length === 0) {
    return//沒有輸入縣市地區的話，按鈕不可有反應
  } else {
    //檢查table中有沒有tr表格?有的話先刪掉
    const storeTable=document.querySelectorAll("#storeTable tr")
    if (storeTable){
      storeTable.forEach((event)=>event.remove())
    }
    
  //  初始載入頁面刪掉 
    const initial=document.querySelector(".initialize")
    if(initial){
      initial.remove()
    }

    //檢查:如果之前顯示"沒有庫存資訊"的話，先把那句話刪掉
    if (TablePanel.lastElementChild.tagName === "H2") {
      const noInfo = document.querySelector(".noInfo")
      noInfo.remove()
    }

    if (FindLocation().length === 0) {
      let h2 = document.createElement('h2')
      h2.innerHTML = "目前沒有庫存資訊"
      h2.classList.add("noInfo")
      TablePanel.appendChild(h2)
    } else {
      createStoreTable(FindLocation())
    }
    
  }
}

function openModal(event) {
  const target = event.target
  if (target.matches(".GoogleMapModal")) {
    const mapModalTitle = document.querySelector("#map-modal-title")
    const mapModalContent = document.querySelector("#map-modal-content")
    const brandName = document.querySelector(".brand-name")
    const showAddress = document.querySelector(".showAddress")
    const getID = target.dataset.id
    const stores = FindLocation()

    modalContent = stores.find(store=>store.ID.includes(getID))

    mapModalTitle.innerHTML = modalContent.Name
    brandName.innerHTML = modalContent.brand
    showAddress.innerHTML = modalContent.Address
    initMap(modalContent)

  }
}

function initMap(position) {
  let map
  let latlng = { lat: 25.046891, lng: 121.516602 }
  map = new google.maps.Map(MapID, {
    center: latlng,
    zoom: 15,
  })

  let pos = {
    lat: Number(position.Lat),
    lng: Number(position.Lon)
  }
  map.setCenter(pos)
  const marker = new google.maps.Marker({
    position: { lat: Number(position.Lat), lng: Number(position.Lon) },
    map: map,
  });
  // container.initMap = map;
}


// 輸入縣市及區域後，查詢
BtnEnter.addEventListener("click", SearchStoreList)
//打開Modal看地圖
TablePanel.addEventListener("click", openModal)

axios
  .get("https://data.nhi.gov.tw/resource/Nhi_Fst/Fstdata.csv")
  .then((response) => {
    const result = response.data;
    // 解析CSV檔案，將其改組成Array(全部的店)，Array裡包Object(各店資訊)
    const NewStoreArray = result.split("\r\n")

    createStoreInformation(NewStoreArray)
  })
  .catch((error) => console.log(error))
