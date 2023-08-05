//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/* 
    1. Paying cases
    2. Open cases as many you pay

*/
contract Gacha is VRFConsumerBaseV2, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string[12] internal itemTokenURI;
    string[12] private caseItem = [
        "Rare sword",
        "Rare knife",
        "Rare armor",
        "Rare necklace",
        "Rare earrings",
        "Rare pet",
        "Rare hat",
        "Rare bracelet",
        "Ulra-rare armor",
        "Ultra-rare knife",
        "Ultra-rare sword",
        "Legendary armor"
    ];

    address private immutable owner;
    uint256 private immutable casePrice;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    mapping(address => uint256) private numCase;
    mapping(uint256 => address) private requestToSender;

    //Request random words variable
    bytes32 private immutable keyHash;
    uint64 private immutable subId;
    uint32 private immutable callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    error NotEnoughETH();
    error YouDontHaveAnyCase();
    error TransferFailed();
    error NotOwner();

    event Item_minted(string indexed, address);
    event itemRequest(uint256 indexed requestID, address);

    constructor(
        uint256 price,
        address coordinator,
        bytes32 _keyHash,
        uint64 _subId,
        uint32 _callbackGasLimit,
        string[12] memory _tokenURI
    ) VRFConsumerBaseV2(coordinator) ERC721("Item", "ITM") {
        // address addr_coordinator = address(coordinator);
        vrfCoordinator = VRFCoordinatorV2Interface(coordinator);
        owner = msg.sender;
        casePrice = price;
        keyHash = _keyHash;
        subId = _subId;
        callbackGasLimit = _callbackGasLimit;
        itemTokenURI = _tokenURI;
    }

    modifier onlyOwner() {
        if (owner == msg.sender) {
            _;
        } else {
            revert NotOwner();
        }
    }

    function payCase() public payable {
        if (msg.value < casePrice) {
            revert NotEnoughETH();
        } else {
            numCase[msg.sender] += 1;
        }
    }

    function openCase() public returns (uint256 requestId) {
        if (numCase[msg.sender] == 0) {
            revert YouDontHaveAnyCase();
        } else {
            requestId = vrfCoordinator.requestRandomWords(
                keyHash,
                subId,
                REQUEST_CONFIRMATIONS,
                callbackGasLimit,
                NUM_WORDS
            );
            requestToSender[requestId] = msg.sender;
            numCase[msg.sender] -= 1;
            emit itemRequest(requestId, msg.sender);
        }
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address itemOwner = requestToSender[requestId];
        uint256 idxItem = randomWords[0] % caseItem.length;

        uint256 newItemId = _tokenIds.current();
        _safeMint(itemOwner, newItemId);
        _setTokenURI(newItemId, itemTokenURI[idxItem]);
        _tokenIds.increment();
        emit Item_minted(caseItem[idxItem], itemOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    function getPrice() public view returns (uint256) {
        return casePrice;
    }

    function getNumCase(uint160 idx) public view returns (uint256) {
        address add_idx = address(idx);
        return numCase[add_idx];
    }

    function getItem() public view returns (string[12] memory) {
        return caseItem;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getrequestToSender(uint256 idx) public view returns (address) {
        return requestToSender[idx];
    }

    function getTokenCounter() public view returns (Counters.Counter memory) {
        return _tokenIds;
    }
}
