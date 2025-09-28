// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LiquidityPool
 * @dev AMM liquidity pool for RWA tokens with HBAR
 */
contract LiquidityPool is ERC20, ReentrancyGuard, Ownable {
    using Math for uint256;
    
    // Pool tokens
    IERC20 public immutable tokenA; // RWA Token
    IERC20 public immutable tokenB; // HBAR (wrapped)
    
    // Pool reserves
    uint256 public reserveA;
    uint256 public reserveB;
    
    // Fee configuration (0.3% = 30 basis points)
    uint256 public constant FEE_BASIS_POINTS = 30;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Minimum liquidity locked forever
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    
    // Events
    event Mint(address indexed sender, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Burn(address indexed sender, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(
        address indexed sender,
        uint256 amountAIn,
        uint256 amountBIn,
        uint256 amountAOut,
        uint256 amountBOut,
        address indexed to
    );
    event Sync(uint256 reserveA, uint256 reserveB);
    
    constructor(
        address _tokenA,
        address _tokenB,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    /**
     * @dev Add liquidity to the pool
     */
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(amountADesired, amountBDesired, amountAMin, amountBMin);
        
        // Transfer tokens to pool
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        liquidity = mint(to);
    }
    
    /**
     * @dev Remove liquidity from the pool
     */
    function removeLiquidity(
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        // Transfer LP tokens to pool
        _transfer(msg.sender, address(this), liquidity);
        
        (amountA, amountB) = burn(to);
        
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");
    }
    
    /**
     * @dev Swap tokens
     */
    function swap(
        uint256 amountAOut,
        uint256 amountBOut,
        address to
    ) external nonReentrant {
        require(amountAOut > 0 || amountBOut > 0, "Insufficient output amount");
        require(amountAOut < reserveA && amountBOut < reserveB, "Insufficient liquidity");
        
        uint256 balanceA;
        uint256 balanceB;
        
        {
            // Transfer output tokens
            if (amountAOut > 0) tokenA.transfer(to, amountAOut);
            if (amountBOut > 0) tokenB.transfer(to, amountBOut);
            
            balanceA = tokenA.balanceOf(address(this));
            balanceB = tokenB.balanceOf(address(this));
        }
        
        uint256 amountAIn = balanceA > reserveA - amountAOut ? balanceA - (reserveA - amountAOut) : 0;
        uint256 amountBIn = balanceB > reserveB - amountBOut ? balanceB - (reserveB - amountBOut) : 0;
        
        require(amountAIn > 0 || amountBIn > 0, "Insufficient input amount");
        
        {
            // Apply fee and check constant product formula
            uint256 balanceAAdjusted = balanceA * BASIS_POINTS - amountAIn * FEE_BASIS_POINTS;
            uint256 balanceBAdjusted = balanceB * BASIS_POINTS - amountBIn * FEE_BASIS_POINTS;
            
            require(
                balanceAAdjusted * balanceBAdjusted >= reserveA * reserveB * (BASIS_POINTS ** 2),
                "K invariant violated"
            );
        }
        
        _update(balanceA, balanceB);
        
        emit Swap(msg.sender, amountAIn, amountBIn, amountAOut, amountBOut, to);
    }
    
    /**
     * @dev Get swap output amount
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (BASIS_POINTS - FEE_BASIS_POINTS);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * BASIS_POINTS + amountInWithFee;
        
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev Get swap input amount
     */
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountIn)
    {
        require(amountOut > 0, "Insufficient output amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 numerator = reserveIn * amountOut * BASIS_POINTS;
        uint256 denominator = (reserveOut - amountOut) * (BASIS_POINTS - FEE_BASIS_POINTS);
        
        amountIn = (numerator / denominator) + 1;
    }
    
    /**
     * @dev Mint LP tokens
     */
    function mint(address to) internal returns (uint256 liquidity) {
        uint256 balanceA = tokenA.balanceOf(address(this));
        uint256 balanceB = tokenB.balanceOf(address(this));
        uint256 amountA = balanceA - reserveA;
        uint256 amountB = balanceB - reserveB;
        
        uint256 _totalSupply = totalSupply();
        
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Lock minimum liquidity
        } else {
            liquidity = Math.min(
                (amountA * _totalSupply) / reserveA,
                (amountB * _totalSupply) / reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(to, liquidity);
        
        _update(balanceA, balanceB);
        
        emit Mint(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Burn LP tokens
     */
    function burn(address to) internal returns (uint256 amountA, uint256 amountB) {
        uint256 balanceA = tokenA.balanceOf(address(this));
        uint256 balanceB = tokenB.balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));
        
        uint256 _totalSupply = totalSupply();
        amountA = (liquidity * balanceA) / _totalSupply;
        amountB = (liquidity * balanceB) / _totalSupply;
        
        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");
        
        _burn(address(this), liquidity);
        tokenA.transfer(to, amountA);
        tokenB.transfer(to, amountB);
        
        balanceA = tokenA.balanceOf(address(this));
        balanceB = tokenB.balanceOf(address(this));
        
        _update(balanceA, balanceB);
        
        emit Burn(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Update reserves
     */
    function _update(uint256 balanceA, uint256 balanceB) private {
        reserveA = balanceA;
        reserveB = balanceB;
        emit Sync(reserveA, reserveB);
    }
    
    /**
     * @dev Calculate optimal liquidity amounts
     */
    function _addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "Insufficient A amount");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    
    /**
     * @dev Get pool info
     */
    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        _reserveA = reserveA;
        _reserveB = reserveB;
    }
    
    /**
     * @dev Calculate price impact
     */
    function calculatePriceImpact(uint256 amountIn, bool isTokenA) external view returns (uint256) {
        if (reserveA == 0 || reserveB == 0) return 0;
        
        uint256 reserveIn = isTokenA ? reserveA : reserveB;
        uint256 reserveOut = isTokenA ? reserveB : reserveA;
        
        uint256 amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        
        // Price before trade
        uint256 priceBefore = (reserveOut * 1e18) / reserveIn;
        
        // Price after trade
        uint256 newReserveIn = reserveIn + amountIn;
        uint256 newReserveOut = reserveOut - amountOut;
        uint256 priceAfter = (newReserveOut * 1e18) / newReserveIn;
        
        // Calculate impact as percentage
        if (priceBefore > priceAfter) {
            return ((priceBefore - priceAfter) * 10000) / priceBefore;
        } else {
            return ((priceAfter - priceBefore) * 10000) / priceBefore;
        }
    }
}
