H = "0x2a3d6b1bd69cff60a8cb1a5977993df8681283799510b26121c06a587bcc7acc";
USE_DOWNSAMPLE = false;
USE_RANDOM_HASH = true;

function getRandomHash () {
  var hash = '0x';
  var hashChars = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  for (var i = 0; i < 64; i++) {
    var index = Math.floor(Math.random() * hashChars.length);
    hash += hashChars[index];
  }
  return hash;
};

/** cut the above out **/

var FORCE_VISIBLE_CANVAS_SIZE = 0; // non-zero forces specific output size
var MAX_RENDER_CANVAS_SIZE = 9600;
var DEFAULT_CANVAS_SCALE = 0.8;
var MIN_CANVAS_SCALE = 0.0625;
var MAX_MINING_ATTEMPTS = 1000000;
var MINE_FOR_HASH = {
  enabled: true && USE_RANDOM_HASH,
  // styleID: 'pajamas',
  // elementID: 'fire',
  // paletteID: 'corrupted',
  // gravityID: 'low',
  // grainID: 'blue',
  // displayID: 'normal',
  // colorPointCount: 6
};

var min = Math.min;
var max = Math.max;
var pow = Math.pow;
var sqrt = Math.sqrt;
var ceil = Math.ceil;
var floor = Math.floor;
var random = null;
var PI = Math.PI;
var TAU = 2 * PI;

function shuffleArray (a) {
  var length = a.length;
  var copy = a.slice();

  while (length) {
    var index = floor(random() * length--);
    var temp = copy[length];
    copy[length] = copy[index];
    copy[index] = temp;
  }

  return copy;
};

function chooseByWeight (data) {
  var choice = null;
  var weightTotal = 0;
  var length = data.length;

  for (var i = 0; i < length; i++) {
    var item = data[i];
    weightTotal += item.weight || 0;
  }

  var roll = random();
  var weightSum = 0;
  for (var i = 0; i < length; i++) {
    var item = data[i];
    weightSum += item.weight;
    choice = item;

    var chance = weightSum / weightTotal;
    if (roll <= chance) {
      break;
    }
  }

  return choice;
};

function chooseByID (data, id) {
  var choice = null;
  var length = data.length;

  for (var i = 0; i < length; i++) {
    var item = data[i];
    choice = item;

    if (item.id === id) {
      break;
    }
  }

  return choice;
};

var visCanvasSize = 600;
var drawCanvasScale = DEFAULT_CANVAS_SCALE;
var drawCanvasSize = visCanvasSize / drawCanvasScale;

var COLOR_CHANNELS = ['r', 'g', 'b'];

var STYLES = [
  {
    id: 'smooth',
    weight: 0.80,
    colorPointCounts: [2, 3, 4, 5, 6],
    sortMethod: SORT_DISTANCE
  },
  {
    id: 'pajamas',
    weight: 0.08,
    colorPointCounts: [5, 6],
    sortMethod: SORT_STEP,
    sortStepSize: 1 / 99
  },
  {
    id: 'silk',
    weight: 0.06,
    colorPointCounts: [5, 6],
    sortMethod: SORT_STEP,
    sortStepSize: 1 / 3
  },
  {
    id: 'retro',
    weight: 0.04,
    colorPointCounts: [4, 6],
    sortMethod: SORT_STEP,
    sortStepSize: 3 / 2
  },
  {
    id: 'sketch',
    weight: 0.02,
    colorPointCounts: [3, 4],
    sortMethod: SORT_RANDOM_STEP
  }
];

var DISPLAYS = [
  {
    id: 'normal',
    weight: 0.25
  },
  {
    id: 'mirrored',
    weight: 0.25,
    flipX: true
  },
  {
    id: 'upsideDown',
    weight: 0.25,
    flipY: true
  },
  {
    id: 'mirroredUpsideDown',
    weight: 0.25,
    flipX: true,
    flipY: true
  }
];

var BASE_COORDS_2 = [
  { x: 0.5, y: 0.5 },
  { x: 0.75, y: 0 }
];

var BASE_COORDS_3 = [
  { x: 0.65, y: 0.15 },
  { x: 0.50, y: 0.50 },
  { x: 0.75, y: 0.75 }
];

var BASE_COORDS_4 = [
  { x: 0.5, y: 0.0 },
  { x: 0.0, y: 0.5 },
  { x: 0.5, y: 1.0 },
  { x: 1.0, y: 0.5 }
];

var BASE_COORDS_5 = [
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.0 },
  { x: 0.0, y: 0.5 },
  { x: 0.5, y: 1.0 },
  { x: 1.0, y: 0.5 }
];

var BASE_COORDS_6 = [
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.0 },
  { x: 1.0, y: 0.0 },
  { x: 1.0, y: 1.0 },
  { x: 0.0, y: 1.0 },
  { x: 0.0, y: 0.0 }
];

var BASE_COORDS = [
  [],
  [],
  BASE_COORDS_2,
  BASE_COORDS_3,
  BASE_COORDS_4,
  BASE_COORDS_5,
  BASE_COORDS_6
];

var COLOR_POINT_RARITIES = [
  [],
  [1],
  [0.8, 0.2],
  [0.8, 0.16, 0.04],
  [0.64, 0.24, 0.08, 0.04],
  [0.4, 0.3, 0.18, 0.08, 0.04],
  [0.36, 0.24, 0.16, 0.12, 0.08, 0.04]
];

var COLOR_GRAVITIES = [
  {
    id: 'lunar',
    value: 0.5,
    weight: 0.05
  },
  {
    id: 'atmospheric',
    value: 1,
    weight: 0.1
  },
  {
    id: 'low',
    value: 2,
    weight: 0.19
  },
  {
    id: 'normal',
    value: 3,
    weight: 0.39
  },
  {
    id: 'high',
    value: 6,
    weight: 0.19
  },
  {
    id: 'massive',
    value: 9,
    weight: 0.05
  },
  {
    id: 'stellar',
    value: 12,
    weight: 0.025
  },
  {
    id: 'galactic',
    value: 24,
    weight: 0.005
  }
];

var WIND_PALETTES = [
  {
    id: 'berry',
    weight: 0.20,
    colors: [
      { r: 82, g: 214, b: 234 },
      { r: 203, g: 75, b: 203 },
      { r: 234, g: 196, b: 145 },
      { r: 203, g: 203, b: 75 },
      { r: 234, g: 82, b: 214 },
      { r: 227, g: 105, b: 48 }
    ]
  },
  {
    id: 'breeze',
    weight: 0.18,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 151, g: 222, b: 203 },
      { r: 213, g: 237, b: 196 },
      { r: 255, g: 212, b: 182 },
      { r: 255, g: 170, b: 167 },
      { r: 16, g: 168, b: 232 }
    ]
  },
  {
    id: 'jolt',
    weight: 0.16,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 247, g: 207, b: 108 },
      { r: 47, g: 14, b: 73 },
      { r: 235, g: 242, b: 243 },
      { r: 193, g: 152, b: 71 }
    ]
  },
  {
    id: 'thunder',
    weight: 0.14,
    shuffle: true,
    colors: [
      { r: 14, g: 28, b: 50 },
      { r: 144, g: 104, b: 194 },
      { r: 7, g: 44, b: 77 },
      { r: 97, g: 83, b: 154 },
      { r: 247, g: 230, b: 212 },
      { r: 184, g: 219, b: 233 }
    ]
  },
  {
    id: 'winter',
    weight: 0.12,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 244, g: 238, b: 254 },
      { r: 220, g: 213, b: 246 },
      { r: 166, g: 176, b: 223 },
      { r: 68, g: 72, b: 115 }
    ]
  },
  {
    id: 'heathermoor',
    weight: 0.08,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 255, g: 245, b: 253 },
      { r: 166, g: 143, b: 171 },
      { r: 255, g: 150, b: 173 },
      { r: 3, g: 46, b: 88 }
    ]
  },
  {
    id: 'zeus',
    weight: 0.08,
    shuffle: true,
    colors: [
      { r: 188, g: 158, b: 139 },
      { r: 156, g: 76, b: 52 },
      { r: 209, g: 198, b: 185 },
      { r: 151, g: 116, b: 112 },
      { r: 122, g: 122, b: 120 },
      { r: 197, g: 136, b: 109 }
    ]
  },
  {
    id: 'matrix',
    weight: 0.04,
    restricted: true,
    colors: [
      { r: 0, g: 18, b: 1 },
      { r: 12, g: 65, b: 15 },
      { r: 31, g: 119, b: 29 },
      { r: 167, g: 255, b: 114 }
    ]
  }
];

var EARTH_PALETTES = [
  {
    id: 'arid',
    weight: 0.20,
    shuffle: true,
    colors: [
      { r: 251, g: 177, b: 83 },
      { r: 228, g: 146, b: 101 },
      { r: 76, g: 33, b: 13 },
      { r: 231, g: 77, b: 12 }
    ]
  },
  {
    id: 'ridge',
    weight: 0.18,
    shuffle: true,
    colors: [
      { r: 4, g: 45, b: 79 },
      { r: 33, g: 51, b: 51 },
      { r: 119, g: 150, b: 196 },
      { r: 30, g: 36, b: 49 },
      { r: 125, g: 141, b: 114 },
      { r: 100, g: 70, b: 111 }
    ]
  },
  {
    id: 'coal',
    weight: 0.16,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 55, g: 35, b: 35 },
      { r: 24, g: 17, b: 17 },
      { r: 67, g: 64, b: 63 },
      { r: 44, g: 44, b: 44 }
    ]
  },
  {
    id: 'touch',
    weight: 0.14,
    shuffle: true,
    colors: [
      { r: 200, g: 165, b: 133 },
      { r: 198, g: 142, b: 129 },
      { r: 168, g: 133, b: 98 },
      { r: 124, g: 75, b: 65 },
      { r: 92, g: 66, b: 41 },
      { r: 78, g: 47, b: 42 },
      { r: 212, g: 160, b: 146 },
      { r: 184, g: 148, b: 112 },
      { r: 183, g: 123, b: 112 },
      { r: 113, g: 82, b: 53 },
      { r: 101, g: 61, b: 52 },
      { r: 72, g: 51, b: 34 }
    ]
  },
  {
    id: 'bronze',
    weight: 0.11,
    shuffle: true,
    colors: [
      { r: 246, g: 175, b: 112 },
      { r: 161, g: 106, b: 68 },
      { r: 115, g: 74, b: 47 },
      { r: 245, g: 191, b: 147 },
      { r: 181, g: 128, b: 81 },
      { r: 81, g: 60, b: 44 }
    ]
  },
  {
    id: 'silver',
    weight: 0.09,
    shuffle: true,
    colors: [
      { r: 244, g: 244, b: 244 },
      { r: 233, g: 233, b: 233 },
      { r: 154, g: 154, b: 154 },
      { r: 103, g: 103, b: 103 },
      { r: 59, g: 59, b: 59 },
      { r: 24, g: 24, b: 24 }
    ]
  },
  {
    id: 'gold',
    weight: 0.07,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 249, g: 215, b: 79 },
      { r: 185, g: 112, b: 34 },
      { r: 195, g: 104, b: 20 },
      { r: 72, g: 28, b: 5 },
      { r: 39, g: 6, b: 1 }
    ]
  },
  {
    id: 'platinum',
    weight: 0.05,
    shuffle: true,
    colors: [
      { r: 235, g: 255, b: 235 },
      { r: 216, g: 233, b: 245 },
      { r: 121, g: 128, b: 136 },
      { r: 199, g: 233, b: 252 },
      { r: 120, g: 189, b: 154 },
      { r: 56, g: 130, b: 117 }
    ]
  }
];

var WATER_PALETTES = [
  {
    id: 'archipelago',
    weight: 0.20,
    shuffle: true,
    colors: [
      { r: 153, g: 203, b: 195 },
      { r: 232, g: 221, b: 201 },
      { r: 0, g: 171, b: 178 },
      { r: 209, g: 178, b: 121 },
      { r: 241, g: 233, b: 211 },
      { r: 45, g: 130, b: 188 }
    ]
  },
  {
    id: 'frozen',
    weight: 0.18,
    shuffle: true,
    colors: [
      { r: 198, g: 228, b: 254 },
      { r: 62, g: 151, b: 240 },
      { r: 12, g: 156, b: 221 },
      { r: 5, g: 74, b: 140 },
      { r: 0, g: 26, b: 51 },
      { r: 19, g: 126, b: 212 }
    ]
  },
  {
    id: 'vapor',
    weight: 0.16,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 142, g: 217, b: 240 },
      { r: 239, g: 240, b: 203 },
      { r: 42, g: 112, b: 145 },
      { r: 94, g: 133, b: 157 }
    ]
  },
  {
    id: 'dawn',
    weight: 0.14,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 5, g: 27, b: 107 },
      { r: 9, g: 82, b: 149 },
      { r: 82, g: 135, b: 196 },
      { r: 255, g: 171, b: 83 }
    ]
  },
  {
    id: 'glacier',
    weight: 0.11,
    shuffle: true,
    colors: [
      { r: 202, g: 236, b: 233 },
      { r: 27, g: 88, b: 100 },
      { r: 96, g: 198, b: 226 },
      { r: 83, g: 176, b: 196 },
      { r: 42, g: 135, b: 144 },
      { r: 20, g: 64, b: 68 }
    ]
  },
  {
    id: 'shanty',
    weight: 0.09,
    shuffle: true,
    colors: [
      { r: 9, g: 43, b: 73 },
      { r: 9, g: 138, b: 178 },
      { r: 0, g: 118, b: 126 },
      { r: 23, g: 176, b: 170 },
      { r: 19, g: 71, b: 179 },
      { r: 8, g: 207, b: 172 }
    ]
  },
  {
    id: 'vice',
    weight: 0.07,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 0, g: 163, b: 224 },
      { r: 0, g: 182, b: 168 },
      { r: 251, g: 163, b: 182 },
      { r: 255, g: 211, b: 181 }
    ]
  },
  {
    id: 'opalescent',
    weight: 0.05,
    ordered: true,
    colors: [
      { r: 243, g: 234, b: 185 },
      { r: 243, g: 220, b: 190 },
      { r: 239, g: 198, b: 202 },
      { r: 212, g: 188, b: 217 },
      { r: 125, g: 198, b: 231 },
      { r: 243, g: 234, b: 185 },
      { r: 243, g: 220, b: 190 },
      { r: 239, g: 198, b: 202 },
      { r: 212, g: 188, b: 217 },
      { r: 125, g: 198, b: 231 }
    ]
  }
];

var NATURE_PALETTES = [
  {
    id: 'jungle',
    weight: 0.20,
    ordered: true,
    colors: [
      { r: 50, g: 90, b: 26 },
      { r: 19, g: 46, b: 5 },
      { r: 36, g: 64, b: 51 },
      { r: 1, g: 8, b: 1 },
      { r: 255, g: 148, b: 0 },
      { r: 255, g: 252, b: 103 },
      { r: 255, g: 142, b: 198 },
      { r: 255, g: 148, b: 0 },
      { r: 1, g: 8, b: 1 },
      { r: 36, g: 64, b: 51 }
    ]
  },
  {
    id: 'spring',
    weight: 0.18,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 167, g: 230, b: 208 },
      { r: 219, g: 238, b: 195 },
      { r: 255, g: 211, b: 183 },
      { r: 255, g: 170, b: 165 }
    ]
  },
  {
    id: 'camouflage',
    weight: 0.16,
    shuffle: true,
    colors: [
      { r: 157, g: 154, b: 97 },
      { r: 95, g: 75, b: 48 },
      { r: 33, g: 33, b: 33 },
      { r: 70, g: 90, b: 64 },
      { r: 80, g: 103, b: 72 },
      { r: 76, g: 55, b: 30 }
    ]
  },
  {
    id: 'blossom',
    weight: 0.14,
    shuffle: true,
    colors: [
      { r: 255, g: 148, b: 0 },
      { r: 255, g: 252, b: 103 },
      { r: 234, g: 51, b: 72 },
      { r: 255, g: 142, b: 198 },
      { r: 180, g: 117, b: 224 },
      { r: 255, g: 225, b: 225 }
    ]
  },
  {
    id: 'leaf',
    weight: 0.12,
    restricted: true,
    colors: [
      { r: 255, g: 240, b: 156 },
      { r: 118, g: 223, b: 170 },
      { r: 211, g: 235, b: 176 },
      { r: 200, g: 129, b: 46 },
      { r: 195, g: 167, b: 91 }
    ]
  },
  {
    id: 'lemonade',
    weight: 0.08,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 248, g: 125, b: 181 },
      { r: 255, g: 186, b: 89 },
      { r: 246, g: 236, b: 150 },
      { r: 9, g: 103, b: 25 }
    ]
  },
  {
    id: 'bioluminescence',
    weight: 0.08,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 37, g: 37, b: 37 },
      { r: 64, g: 0, b: 11 },
      { r: 99, g: 0, b: 145 },
      { r: 110, g: 240, b: 168 },
      { r: 139, g: 30, b: 216 },
      { r: 24, g: 105, b: 200 }
    ]
  },
  {
    id: 'rainforest',
    weight: 0.04,
    ordered: true,
    colors: [
      { r: 33, g: 167, b: 72 },
      { r: 8, g: 133, b: 127 },
      { r: 109, g: 203, b: 105 },
      { r: 47, g: 142, b: 98 },
      { r: 108, g: 209, b: 17 },
      { r: 25, g: 137, b: 0 }
    ]
  }
];

var LIGHT_PALETTES = [
  {
    id: 'pastel',
    weight: 0.20,
    shuffle: true,
    colors: [
      { r: 255, g: 195, b: 160 },
      { r: 255, g: 175, b: 189 },
      { r: 253, g: 219, b: 145 },
      { r: 209, g: 253, b: 255 },
      { r: 132, g: 250, b: 176 },
      { r: 143, g: 211, b: 244 },
      { r: 251, g: 194, b: 235 },
      { r: 161, g: 140, b: 209 }
    ]
  },
  {
    id: 'holy',
    weight: 0.18,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 255, g: 253, b: 237 },
      { r: 254, g: 234, b: 191 },
      { r: 252, g: 209, b: 164 },
      { r: 238, g: 191, b: 157 },
      { r: 170, g: 146, b: 152 }
    ]
  },
  {
    id: 'sylvan',
    weight: 0.16,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 254, g: 177, b: 196 },
      { r: 243, g: 242, b: 247 },
      { r: 115, g: 170, b: 234 },
      { r: 195, g: 116, b: 139 },
      { r: 195, g: 165, b: 194 },
      { r: 117, g: 196, b: 241 }
    ]
  },
  {
    id: 'glow',
    weight: 0.14,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 125, g: 255, b: 221 },
      { r: 183, g: 144, b: 251 },
      { r: 142, g: 126, b: 248 },
      { r: 255, g: 155, b: 223 }
    ]
  },
  {
    id: 'sunset',
    weight: 0.12,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 242, g: 107, b: 80 },
      { r: 226, g: 103, b: 147 },
      { r: 255, g: 145, b: 136 },
      { r: 180, g: 82, b: 107 },
      { r: 129, g: 75, b: 124 }
    ]
  },
  {
    id: 'infrared',
    weight: 0.08,
    ordered: true,
    colors: [
      { r: 253, g: 243, b: 122 },
      { r: 255, g: 172, b: 0 },
      { r: 242, g: 93, b: 1 },
      { r: 206, g: 12, b: 135 },
      { r: 126, g: 1, b: 159 },
      { r: 5, g: 0, b: 103 },
      { r: 206, g: 12, b: 135 },
      { r: 242, g: 93, b: 1 }
    ]
  },
  {
    id: 'ultraviolet',
    weight: 0.02,
    shuffle: true,
    colors: [
      { r: 216, g: 172, b: 255 },
      { r: 77, g: 0, b: 188 },
      { r: 255, g: 247, b: 255 },
      { r: 244, g: 130, b: 254 },
      { r: 178, g: 0, b: 254 },
      { r: 23, g: 0, b: 82 }
    ]
  },
  {
    id: 'yang',
    weight: 0.04,
    colors: [
      { r: 255, g: 255, b: 255 }
    ]
  }
];

var SHADOW_PALETTES = [
  {
    id: 'moonrise',
    weight: 0.20,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 18, g: 4, b: 127 },
      { r: 255, g: 161, b: 108 },
      { r: 88, g: 0, b: 124 },
      { r: 18, g: 1, b: 75 }
    ]
  },
  {
    id: 'umbral',
    weight: 0.18,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 68, g: 88, b: 94 },
      { r: 249, g: 230, b: 125 },
      { r: 28, g: 39, b: 50 },
      { r: 172, g: 53, b: 3 },
      { r: 254, g: 255, b: 153 }
    ]
  },
  {
    id: 'darkness',
    weight: 0.16,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 44, g: 6, b: 68 },
      { r: 24, g: 0, b: 79 },
      { r: 18, g: 1, b: 75 },
      { r: 10, g: 10, b: 10 }
    ]
  },
  {
    id: 'sharkskin',
    weight: 0.14,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 35, g: 41, b: 50 },
      { r: 58, g: 63, b: 71 },
      { r: 0, g: 173, b: 181 },
      { r: 238, g: 238, b: 238 }
    ]
  },
  {
    id: 'void',
    weight: 0.12,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 24, g: 0, b: 79 },
      { r: 64, g: 0, b: 111 },
      { r: 99, g: 0, b: 145 },
      { r: 199, g: 38, b: 133 },
      { r: 10, g: 10, b: 10 }
    ]
  },
  {
    id: 'immortal',
    weight: 0.08,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 25, g: 16, b: 16 },
      { r: 108, g: 27, b: 37 },
      { r: 133, g: 15, b: 52 },
      { r: 246, g: 0, b: 43 },
      { r: 2, g: 29, b: 84 }
    ]
  },
  {
    id: 'undead',
    weight: 0.08,
    restricted: true,
    colors: [
      { r: 54, g: 31, b: 57 },
      { r: 0, g: 197, b: 163 },
      { r: 114, g: 159, b: 175 },
      { r: 115, g: 106, b: 147 },
      { r: 160, g: 193, b: 184 }
    ]
  },
  {
    id: 'yin',
    weight: 0.04,
    colors: [
      { r: 0, g: 0, b: 0 }
    ]
  }
];

var ARCANE_PALETTES = [
  {
    id: 'plastic',
    weight: 0.20,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 255, g: 237, b: 218 },
      { r: 61, g: 178, b: 255 },
      { r: 255, g: 184, b: 48 },
      { r: 255, g: 36, b: 66 }
    ]
  },
  {
    id: 'cosmic',
    weight: 0.18,
    ordered: true,
    colors: [
      { r: 18, g: 10, b: 56 },
      { r: 165, g: 82, b: 130 },
      { r: 65, g: 36, b: 103 },
      { r: 255, g: 225, b: 215 },
      { r: 51, g: 37, b: 108 },
      { r: 192, g: 114, b: 128 }
    ]
  },
  {
    id: 'bubble',
    weight: 0.16,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 168, g: 216, b: 233 },
      { r: 171, g: 148, b: 216 },
      { r: 253, g: 185, b: 210 },
      { r: 255, g: 255, b: 212 }
    ]
  },
  {
    id: 'esper',
    weight: 0.14,
    restricted: true,
    colors: [
      { r: 238, g: 209, b: 232 },
      { r: 89, g: 134, b: 173 },
      { r: 197, g: 72, b: 91 },
      { r: 181, g: 136, b: 154 }
    ]
  },
  {
    id: 'spirit',
    weight: 0.12,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 9, g: 1, b: 10 },
      { r: 75, g: 14, b: 70 },
      { r: 125, g: 18, b: 116 },
      { r: 252, g: 157, b: 198 }
    ]
  },
  {
    id: 'colorless',
    weight: 0.08,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 25, g: 25, b: 25 },
      { r: 230, g: 230, b: 230 }
    ]
  },
  {
    id: 'entropy',
    weight: 0.08,
    colors: []
  },
  {
    id: 'yinyang',
    weight: 0.04,
    shuffle: true,
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 }
    ]
  }
];

var FIRE_PALETTES = [
  {
    id: 'volcano',
    weight: 0.20,
    shuffle: true,
    colors: [
      { r: 48, g: 28, b: 35 },
      { r: 229, g: 77, b: 26 },
      { r: 224, g: 42, b: 5 },
      { r: 246, g: 177, b: 141 },
      { r: 96, g: 113, b: 115 },
      { r: 23, g: 20, b: 22 }
    ]
  },
  {
    id: 'heat',
    weight: 0.18,
    restricted: true,
    colors: [
      { r: 9, g: 2, b: 1 },
      { r: 185, g: 68, b: 6 },
      { r: 242, g: 189, b: 66 },
      { r: 105, g: 20, b: 0 }
    ]
  },
  {
    id: 'flare',
    weight: 0.16,
    restricted: true,
    colors: [
      { r: 249, g: 137, b: 73 },
      { r: 0, g: 45, b: 60 },
      { r: 251, g: 250, b: 177 },
      { r: 190, g: 90, b: 43 }
    ]
  },
  {
    id: 'solar',
    weight: 0.14,
    restricted: true,
    colors: [
      { r: 15, g: 4, b: 2 },
      { r: 96, g: 35, b: 3 },
      { r: 249, g: 196, b: 45 },
      { r: 252, g: 217, b: 121 }
    ]
  },
  {
    id: 'summer',
    weight: 0.11,
    shuffle: true,
    restricted: true,
    colors: [
      { r: 250, g: 173, b: 131 },
      { r: 255, g: 103, b: 104 },
      { r: 255, g: 60, b: 103 },
      { r: 168, g: 49, b: 134 }
    ]
  },
  {
    id: 'ember',
    weight: 0.09,
    restricted: true,
    colors: [
      { r: 18, g: 2, b: 2 },
      { r: 121, g: 0, b: 2 },
      { r: 107, g: 0, b: 5 },
      { r: 255, g: 129, b: 33 }
    ]
  },
  {
    id: 'comet',
    weight: 0.07,
    restricted: true,
    colors: [
      { r: 3, g: 2, b: 10 },
      { r: 12, g: 67, b: 143 },
      { r: 67, g: 198, b: 216 },
      { r: 9, g: 51, b: 117 }
    ]
  },
  {
    id: 'corrupted',
    weight: 0.05,
    restricted: true,
    colors: [
      { r: 3, g: 3, b: 15 },
      { r: 55, g: 0, b: 130 },
      { r: 100, g: 0, b: 178 },
      { r: 218, g: 73, b: 192 }
    ]
  }
];

var ELEMENTS = [
  {
    id: 'light',
    weight: 0.125,
    palettes: LIGHT_PALETTES
  },
  {
    id: 'nature',
    weight: 0.125,
    palettes: NATURE_PALETTES
  },
  {
    id: 'arcane',
    weight: 0.125,
    palettes: ARCANE_PALETTES
  },
  {
    id: 'water',
    weight: 0.125,
    palettes: WATER_PALETTES
  },
  {
    id: 'earth',
    weight: 0.125,
    palettes: EARTH_PALETTES
  },
  {
    id: 'wind',
    weight: 0.125,
    palettes: WIND_PALETTES
  },
  {
    id: 'fire',
    weight: 0.125,
    palettes: FIRE_PALETTES
  },
  {
    id: 'shadow',
    weight: 0.125,
    palettes: SHADOW_PALETTES
  }
];

var GRAINS = [
  {
    id: 'null',
    weight: 0.001,
    r: { offset: 0, range: -512 },
    g: { offset: 0, range: -512 },
    b: { offset: 0, range: -512 }
  },
  {
    id: 'faded',
    weight: 0.004,
    r: { offset: 0, range: -128 },
    g: { offset: 0, range: -128 },
    b: { offset: 0, range: -128 }
  },
  {
    id: 'none',
    weight: 0.255,
    r: { offset: 0, range: 0 },
    g: { offset: 0, range: 0 },
    b: { offset: 0, range: 0 }
  },
  {
    id: 'soft',
    weight: 0.32,
    r: { offset: -4, range: 8 },
    g: { offset: -4, range: 8 },
    b: { offset: -4, range: 8 }
  },
  {
    id: 'medium',
    weight: 0.18,
    r: { offset: -8, range: 16 },
    g: { offset: -8, range: 16 },
    b: { offset: -8, range: 16 }
  },
  {
    id: 'rough',
    weight: 0.06,
    r: { offset: -16, range: 32 },
    g: { offset: -16, range: 32 },
    b: { offset: -16, range: 32 }
  },
  {
    id: 'red',
    weight: 0.06,
    r: { offset: -16, range: 32 },
    g: { offset: 0, range: 0 },
    b: { offset: 0, range: 0 }
  },
  {
    id: 'green',
    weight: 0.06,
    r: { offset: 0, range: 0 },
    g: { offset: -16, range: 32 },
    b: { offset: 0, range: 0 }
  },
  {
    id: 'blue',
    weight: 0.06,
    r: { offset: 0, range: 0 },
    g: { offset: 0, range: 0 },
    b: { offset: -16, range: 32 }
  }
];

var windowWidth = 0;
var windowHeight = 0;
var drawCanvas = null;
var visCanvas = null;
var paletteCanvas = null;
var paletteCtx = null;
var loadCanvas = null;
var loadCtx = null;
var loadWidth = 0;
var renderButton = null;
var pixelLabel = null;
var pixelInput = null;
var downsampleLabel = null;
var downsampleCheckmark = null;

var styleID = '';
var displayID = '';
var elementID = '';
var paletteID = '';
var gravityID = '';
var grainID = '';
var gravity = 1;
var colorPointCounts = [2, 3, 4, 5, 6];
var colorPointCount = 4;
var colorPoints = [];
var sortMethod = SORT_DISTANCE;
var sortValue = -1;
var sortStepSize = 1;
var placementIndex = 0;
var placementCoords = BASE_COORDS[colorPointCount];
var lastRandomColor = { r: 0, g: 0, b: 0 };
var isFirstRandomColor = true;
var flipX = false;
var flipY = false;

function SORT_DISTANCE (a, b) { return a.distance - b.distance; };

function SORT_STEP () {
  var value = sortValue;
  sortValue += sortStepSize;
  if (sortValue >= 2) { sortValue -= 3; }
  return value;
};

function SORT_RANDOM_STEP () {
  var value = sortValue;
  sortValue += 1 / (random() * drawCanvasSize);
  if (sortValue >= 2) { sortValue -= 3; }
  return value;
};

var PAD = 8;
var LOADS = { render: 0.9, reduce: 0.1 };
var loadPct = 0;
var renderPct = 0;
var reducePct = 0;
function updateLoadPct () {
  loadPct = LOADS.render * renderPct + LOADS.reduce * reducePct;

  if (!loadWidth) {
    loadWidth = loadCanvas.width;
    loadCtx.fillStyle = "rgb(25,255,25)";
  }

  var fillWidth = loadPct * loadWidth;
  loadCtx.fillRect(0, 0, fillWidth, PAD);
};

function renderColorSwatches () {
  var count = colorPoints.length;
  var size = 2 * PAD;
  var width = count * 2 * size - size;
  var startX = (loadWidth - width) / 2;
  for (var i = 0; i < count; i++) {
    var pt = colorPoints[i];
    var x = startX + i * 2 * size;

    paletteCtx.fillStyle='#000';
    paletteCtx.fillRect(x - 1, 0, size + 2, size + 2);
    paletteCtx.fillStyle = "rgb("+pt.r+","+pt.g+","+pt.b+")";
    paletteCtx.fillRect(x, 1, size, size);
  }
};

window.onload = function () { initialize(); };

function initialize () {
  setRenderOptions();
  setSeed();
  rollRarity();

  if (MINE_FOR_HASH.enabled) {
    mineForHashMatch();
  }

  console.log(`Hash: ${H}`);

  createElements();
  startRender();
};

function mineForHashMatch () {
  console.log(`Mining for hash ...`);

  var attempts = 1;
  while (!isHashFound() && attempts < MAX_MINING_ATTEMPTS) {
    setSeed();
    rollRarity();
    attempts++;
  }

  if (attempts >= MAX_MINING_ATTEMPTS) {
    console.warn(`Exceeded limit! Try Again? Attempts: `, attempts);
  } else {
    console.log(`Success! Attempts: `, attempts);
  }
};

function setSeed () {
  if (USE_RANDOM_HASH) {
    H = getRandomHash();
  }

  var S = Uint32Array.from([0,1,s=t=2,3].map(function (i) {
    return parseInt(H.substr(i*8+2,8),16);
  }));

  random = function () {
    return t=S[3],S[3]=S[2],S[2]=S[1],S[1]=s=S[0],t^=t<<11,S[0]^=(t^t>>>8)^(s>>>19),S[0]/2**32;
  };'tx piter';
};

function setRenderOptions () {
  var body = document.body;
  body.style.overflow = 'hidden';

  windowWidth = max(body.clientWidth, window.innerWidth);
  windowHeight = max(body.clientHeight, window.innerHeight);

  var isLandscape = windowWidth > windowHeight;
  var windowSize = isLandscape ? windowHeight : windowWidth;

  if (FORCE_VISIBLE_CANVAS_SIZE > 0) {
    visCanvasSize = min(MAX_RENDER_CANVAS_SIZE, FORCE_VISIBLE_CANVAS_SIZE);
  } else {
    visCanvasSize = min(MAX_RENDER_CANVAS_SIZE, windowSize);
  }

  if (USE_DOWNSAMPLE) {
    drawCanvasScale = MIN_CANVAS_SCALE;
  } else {
    drawCanvasScale = DEFAULT_CANVAS_SCALE;
  }

  drawCanvasSize = floor(visCanvasSize / drawCanvasScale);
  if (drawCanvasSize > MAX_RENDER_CANVAS_SIZE) {
    drawCanvasSize = MAX_RENDER_CANVAS_SIZE;
  }

  drawCanvasScale = visCanvasSize / drawCanvasSize;

  loadPct = 0;
  renderPct = 0;
  reducePct = 0;
  loadWidth = 0;
  sortValue = -1;
  placementIndex = 0;
  lastRandomColor = { r: 0, g: 0, b: 0 };
  isFirstRandomColor = true;
  colorPoints.length = 0;
};

function rollRarity () {
  var elementData = chooseByWeight(ELEMENTS);
  elementID = elementData.id;

  var paletteData = chooseByWeight(elementData.palettes);
  paletteID = paletteData.id;

  var gravityData = chooseByWeight(COLOR_GRAVITIES);
  gravityID = gravityData.id;
  gravity = gravityData.value;

  var displayData = chooseByWeight(DISPLAYS);
  displayID = displayData.id;
  flipX = displayData.flipX || false;
  flipY = displayData.flipY || false;

  var grainData = chooseByWeight(GRAINS);
  grainID = grainData.id;

  var styleData = chooseByWeight(STYLES);
  styleID = styleData.id;
  colorPointCounts = styleData.colorPointCounts || colorPointCounts;
  sortMethod = styleData.sortMethod || sortMethod;
  sortStepSize = styleData.sortStepSize || sortStepSize;

  var totalRarity = 0;
  var colorRoll = random();
  var colorRarities = COLOR_POINT_RARITIES[colorPointCounts.length];
  for (var i = 0; i < colorRarities.length; i++) {
    totalRarity += colorRarities[i];
    colorPointCount = colorPointCounts[i];
    if (colorRoll <= totalRarity) {
      break;
    }
  }

  var isLowGravity = gravity < 2.5;
  if (colorPointCount >= 4 && isLowGravity && styleID === 'smooth') {
    var slicedGravities = COLOR_GRAVITIES.slice(3);
    gravityData = chooseByWeight(slicedGravities);
    gravityID = gravityData.id;
    gravity = gravityData.value;
  }

  placementCoords = BASE_COORDS[colorPointCount];
};

function isHashFound () {
  var isFound = true;
  var target = MINE_FOR_HASH;

  if (target.styleID !== undefined) {
    isFound = isFound && styleID === target.styleID;
  }

  if (target.elementID !== undefined) {
    isFound = isFound && elementID === target.elementID;
  }

  if (target.paletteID !== undefined) {
    isFound = isFound && paletteID === target.paletteID;
  }

  if (target.gravityID !== undefined) {
    isFound = isFound && gravityID === target.gravityID;
  }

  if (target.displayID !== undefined) {
    isFound = isFound && displayID === target.displayID;
  }

  if (target.colorPointCount !== undefined) {
    isFound = isFound && colorPointCount === target.colorPointCount;
  }

  if (target.grainID !== undefined) {
    isFound = isFound && grainID === target.grainID;
  }

  return isFound;
};

function setupColors () {
  var elementData = chooseByID(ELEMENTS, elementID);
  var paletteData = chooseByID(elementData.palettes, paletteID);
  var colors = paletteData.colors.slice();

  if (paletteData.shuffle) {
    colors = shuffleArray(colors);
  } else if (paletteData.ordered) {
    var orderedColors = [];

    var startIndex = floor(random() * colors.length);
    for (var i = 0; i < colors.length; i++) {
      var currIndex = startIndex + i;
      if (currIndex >= colors.length) {
        currIndex -= colors.length;
      }

      orderedColors.push(colors[currIndex]);
    }

    colors = orderedColors;
  }

  for (var i = 0; i < colorPointCount; i++) {
    var pt = getColorPoint();
    placePoint(pt);
    pt.weight = pow(gravity, 5 - i);

    var index = i;
    while (index >= colors.length) {
      index = paletteData.restricted ? index - colors.length : -1;
    }

    if (index >= 0) {
      var color = colors[index];
      var offsetR = -5 + 10 * random();
      var offsetG = -5 + 10 * random();
      var offsetB = -5 + 10 * random();
      pt.r = max(0, min(255, color.r + offsetR));
      pt.g = max(0, min(255, color.g + offsetG));
      pt.b = max(0, min(255, color.b + offsetB));
    } else {
      setRandomColor(pt);
    }

    colorPoints.push(pt);
  }

  if (colorPointCount === 2) {
    var pt1 = colorPoints[0];
    var pt2 = colorPoints[1];
    while (true) {
      var dy = pt2.y - pt1.y;
      var dx = pt2.x - pt1.x;
      var slope = dy / (dx || 1);
      if (slope >= -1.2 && slope <= -0.8) {
        placementIndex = 0;
        placePoint(pt1);
        placePoint(pt2);
      } else {
        break;
      }
    }
  }

  renderColorSwatches();

  console.log(`~~~`);
  console.log(`Element: ${elementID}`);
  console.log(`Palette: ${paletteID}`);
  console.log(`Colors: ${colorPointCount}`);
  console.log(`Gravity: ${gravityID}`);
  console.log(`Style: ${styleID}`);
  console.log(`Grain: ${grainID}`);
  console.log(`Display: ${displayID}`);
  console.log(`~~~`);
  console.log(`Points: `, colorPoints);
  console.log('Render Size: ', drawCanvasSize);
};

function createElements () {
  drawCanvas = document.createElement('canvas');

  visCanvas = document.createElement("canvas");
  visCanvas.style.position = "absolute";
  visCanvas.style.border = "1px solid";
  document.body.appendChild(visCanvas);

  paletteCanvas = document.createElement("canvas");
  paletteCanvas.style.position = "absolute";
  document.body.appendChild(paletteCanvas);
  paletteCtx = paletteCanvas.getContext("2d");

  loadCanvas = document.createElement("canvas");
  loadCanvas.style.position = "absolute";
  loadCanvas.style.border = "1px solid";
  document.body.appendChild(loadCanvas);
  loadCtx = loadCanvas.getContext("2d");

  renderButton = document.createElement("button");
  renderButton.style.position = "absolute";
  renderButton.innerHTML = "Render";
  renderButton.addEventListener('click', onRenderClicked);
  document.body.appendChild(renderButton);

  pixelLabel = document.createElement("label");
  pixelLabel.style.position = "absolute";
  pixelLabel.innerHTML = "Size in Pixels (16 - 9600):";
  document.body.appendChild(pixelLabel);

  pixelInput = document.createElement("input");
  pixelInput.style.position = "absolute";
  pixelInput.min = 16;
  pixelInput.max = MAX_RENDER_CANVAS_SIZE;
  pixelInput.value = visCanvasSize;
  pixelInput.type = "number";
  document.body.appendChild(pixelInput);

  downsampleLabel = document.createElement("label");
  downsampleLabel.style.position = "absolute";
  downsampleLabel.innerHTML = "Downsample (Best Result):";
  document.body.appendChild(downsampleLabel);

  downsampleCheckmark = document.createElement("input");
  downsampleCheckmark.style.position = "absolute";
  downsampleCheckmark.type = "checkbox";
  downsampleCheckmark.checked = true;
  document.body.appendChild(downsampleCheckmark);
}

function startRender () {
  resizeVisibleCanvas();
  renderVibing();
  updateLoadPct();

  drawCanvas.width = drawCanvasSize;
  drawCanvas.height = drawCanvasSize;

  render(drawCanvas, function () {
    if (drawCanvasScale <= 0.4) {
      processImage(drawCanvas, function (reducedCanvas) {
        drawToVisibleCanvas(reducedCanvas);
        setResizeHandler(reducedCanvas);
      });
    } else {
      drawToVisibleCanvas(drawCanvas);
      setResizeHandler(drawCanvas);
      reducePct = 1;
      updateLoadPct();
    }
  });
};

var resizeCallback = null;
function setResizeHandler (offscreenCanvas) {
  window.removeEventListener('resize', resizeCallback, true);

  resizeCallback = function () {
    setRenderOptions();
    resizeVisibleCanvas();
    drawToVisibleCanvas(offscreenCanvas);
  };

  window.addEventListener('resize', resizeCallback, true);
};

function renderVibing () {
  var fontSize = floor(visCanvasSize / 12.5);
  var letterSpacing = floor(fontSize / 12);
  var offsetX = visCanvasSize / 60;
  var visCtx = visCanvas.getContext("2d");
  visCanvas.style.letterSpacing = letterSpacing + 'px';
  visCtx.fillStyle = "#161616";
  visCtx.fillRect(0, 0, visCanvasSize, visCanvasSize);
  visCtx.fillStyle = "#E9E9E9";
  visCtx.font = fontSize + "px sans-serif";
  visCtx.textBaseline = "middle";
  visCtx.textAlign = "center";
  visCtx.fillText("vibing...", offsetX + visCanvasSize / 2, visCanvasSize / 2, visCanvasSize);
};

function render (canvas, callback) {
  var startTime = Date.now();
  var ctx = canvas.getContext("2d");
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  drawColorPointsGradient(imageData, function () {
    ctx.putImageData(imageData, 0, 0);
    console.log('Render Time: ', Date.now() - startTime);
    callback();
  }, false);
};

var _logTimeout = 0;
function resizeVisibleCanvas () {
  var x = floor((windowWidth - visCanvasSize) / 2);
  var y = floor((windowHeight - visCanvasSize) / 2);
  var loadX = x + PAD;
  var loadY = y + visCanvasSize + PAD;
  var uiX = loadX;
  var uiY = loadY + 2 * PAD;

  visCanvas.style.left = x + "px";
  visCanvas.style.top = y + "px";
  visCanvas.width = visCanvasSize;
  visCanvas.height = visCanvasSize;

  paletteCanvas.style.left = loadX + "px";
  paletteCanvas.style.top = (y - 3 * PAD - 2) + "px";
  paletteCanvas.width = visCanvasSize - 2 * PAD;
  paletteCanvas.height = 2 * PAD + 2;

  loadCanvas.style.left = loadX + "px";
  loadCanvas.style.top = loadY + "px";
  loadCanvas.width = visCanvasSize - 2 * PAD;
  loadCanvas.height = PAD;

  pixelLabel.style.left = uiX + "px";
  pixelLabel.style.top = uiY + "px";

  pixelInput.style.left = (uiX + 180) + "px";
  pixelInput.style.top = uiY + "px";

  downsampleLabel.style.left = uiX + "px";
  downsampleLabel.style.top = (uiY + 3 * PAD) + "px";

  downsampleCheckmark.style.left = (uiX + 180) + "px";
  downsampleCheckmark.style.top = (uiY + 3 * PAD) + "px";

  renderButton.style.left = uiX + "px";
  renderButton.style.top = (uiY + 6 * PAD) + "px";

  _logTimeout && clearTimeout(_logTimeout);
  _logTimeout = setTimeout(function () {
    console.log('Visible Size: ', visCanvasSize);
    _logTimeout = 0;
  }, 250);
};

function drawToVisibleCanvas (offscreenCanvas) {
  var visCtx = visCanvas.getContext("2d");
  visCtx.webkitImageSmoothingEnabled = false;

  if (flipX) {
    visCtx.translate(visCanvasSize, 0);
    visCtx.scale(-1, 1);
  }

  if (flipY) {
    visCtx.translate(0, visCanvasSize);
    visCtx.scale(1, -1);
  }

  visCtx.drawImage(offscreenCanvas, 0, 0, visCanvasSize, visCanvasSize);

  applyGrain(visCtx);
};

function applyGrain (ctx) {
  var grain = chooseByID(GRAINS, grainID);
  var imageData = ctx.getImageData(0, 0, visCanvasSize, visCanvasSize);
  var data = imageData.data;
  var dataLength = data.length;
  for (var i = 0; i < dataLength; i += 4) {
    data[i + 0] += grain.r.offset + random() * grain.r.range;
    data[i + 1] += grain.g.offset + random() * grain.g.range;
    data[i + 2] += grain.b.offset + random() * grain.b.range;
  }
  ctx.putImageData(imageData, 0, 0);
};

function processImage (offscreenCanvas, callback) {
  var startTime = Date.now();
  var img = new Image();
  img.src = offscreenCanvas.toDataURL();
  img.addEventListener("load", function () {
    console.log('Load Time: ', Date.now() - startTime);
    startTime = Date.now();

    reducePct = 0.6;
    updateLoadPct();

    var reducedCanvas = reduceImage(img, visCanvasSize, visCanvasSize);
    callback(reducedCanvas);

    console.log('Process Time: ', Date.now() - startTime);
  });
};

var _x = 0;
var _y = 0;
function drawColorPointsGradient (imageData, callback, isResuming) {
  var startTime = Date.now();

  if (!isResuming) {
    _x = 0;
    _y = 0;
    setupColors();
  }

  while (_x < drawCanvasSize) {
    _y = 0;
    while (_y < drawCanvasSize) {
      setQuadGradientColorForPoint(imageData, colorPoints, _x, _y, drawCanvasSize, drawCanvasSize);
      _y++;
    }
    _x++;

    var elapsed = Date.now() - startTime;
    if (elapsed >= 500) {
      renderPct = _x / drawCanvasSize;
      updateLoadPct();
      break;
    }
  }

  if (_x === drawCanvasSize) {
    renderPct = 1;
    updateLoadPct();
    callback();
  } else {
    setTimeout(function () { drawColorPointsGradient(imageData, callback, true); }, 0);
  }
};

function getColorPoint () {
  return {
    x: 0,
    y: 0,
    r: 0,
    g: 0,
    b: 0,
    weight: 1,
    distance: 0
  };
};

function placePoint (pt) {
  var coords = placementCoords[placementIndex++];
  if (placementIndex >= placementCoords.length) {
    placementIndex = 0;
  }

  var offsetX = -0.125 + 0.25 * random();
  var offsetY = -0.125 + 0.25 * random();
  pt.x = (coords.x + offsetX) * drawCanvasSize;
  pt.y = (coords.y + offsetY) * drawCanvasSize;
};

function setRandomColor (pt) {
  if (isFirstRandomColor) {
    pt.r = 255 * random();
    pt.g = 255 * random();
    pt.b = 255 * random();
  } else {
    var delta = 60 + random() * 30;
    var channels = COLOR_CHANNELS.slice();
    while (channels.length) {
      var index = floor(random() * channels.length);
      var channel = channels.splice(index, 1)[0];
      var value = lastRandomColor[channel];

      if (value - delta < 0) {
        pt[channel] = value + delta;
      } else if (value + delta > 255) {
        pt[channel] = value - delta;
      } else {
        var directionRoll = random();
        if (directionRoll <= 0.5) {
          pt[channel] = value + delta;
        } else {
          pt[channel] = value - delta;
        }
      }

      delta /= 2;
    }
  }

  lastRandomColor.r = pt.r;
  lastRandomColor.g = pt.g;
  lastRandomColor.b = pt.b;
  isFirstRandomColor = false;
};

function setQuadGradientColorForPoint (imageData, pts, x, y, width, height) {
  sortForClosestColorPoints(pts, x, y);

  var newPts = [];
  var length = pts.length;
  for (var i = 0; i < length; i += 2) {
    if (i === length - 1) {
      newPts.push(pts[i]);
    } else {
      newPts.push(smashColors(pts[i], pts[i + 1]));
    }
  }

  if (newPts.length === 1) {
    var col = x * 4;
    var row = y * width * 4;
    var index = row + col;
    var color = newPts[0];
    var data = imageData.data;

    data[index + 0] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = 255;
  } else {
    setQuadGradientColorForPoint(imageData, newPts, x, y, width, height);
  }
};

function sortForClosestColorPoints (pts, x, y) {
  for (var i = 0; i < pts.length; i++) {
    var pt = pts[i];
    pt.distance = getDistanceCubed(x, y, pt.x, pt.y);
  }

  pts.sort(sortMethod);
};

function getDistanceCubed (x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return pow(dx, 3) + pow(dy, 3);
};

function smashColors (c1, c2) {
  var c3 = getColorPoint();

  var c1r = c1.r;
  var c1g = c1.g;
  var c1b = c1.b;
  var c2r = c2.r;
  var c2g = c2.g;
  var c2b = c2.b;
  var c1Weight = c1.weight;
  var c2Weight = c2.weight;

  var dr = c2r - c1r;
  var dg = c2g - c1g;
  var db = c2b - c1b;
  var c1Distance = c1.distance * c1Weight;
  var c2Distance = c2.distance * c2Weight;
  var distTotal = c1Distance + c2Distance;
  var distPct = c2Distance / distTotal;

  c3.x = (c1.x + c2.x) / 2;
  c3.y = (c1.y + c2.y) / 2;
  c3.r = distPct * dr + c1r;
  c3.g = distPct * dg + c1g;
  c3.b = distPct * db + c1b;
  c3.weight = (c1Weight + c2Weight) / 2;

  return c3;
};

function reduceImage (img, w, h) {
  var x, y = 0, sx, sy, ssx, ssy, r, g, b;
  var srcW = img.naturalWidth;
  var srcH = img.naturalHeight;
  var srcCan = Object.assign(document.createElement("canvas"), {width: srcW, height: srcH});
  var sCtx = srcCan.getContext("2d");
  var destCan = Object.assign(document.createElement("canvas"), {width: w, height: h});
  var dCtx = destCan.getContext("2d");

  sCtx.drawImage(img, 0 , 0);

  var srcData = sCtx.getImageData(0,0,srcW,srcH).data;
  var destData = dCtx.getImageData(0,0,w,h);
  var xStep = srcW / w, yStep = srcH / h;
  var area = xStep * yStep
  var sD = srcData, dD = destData.data;

  while (y < h) {
    sy = y * yStep;
    x = 0;
    while (x < w) {
      sx = x * xStep;
      var ssyB = sy + yStep;
      var ssxR = sx + xStep;
      r = g = b = a = 0;
      ssy = sy | 0;
      while (ssy < ssyB) {
        var yy1 = ssy + 1;
        var yArea = yy1 > ssyB ? ssyB - ssy : ssy < sy ? 1 - (sy - ssy) : 1;
        ssx = sx | 0;
        while (ssx < ssxR) {
          var xx1 = ssx + 1;
          var xArea = xx1 > ssxR ? ssxR - ssx : ssx < sx ? 1 - (sx - ssx) : 1;
          var srcContribution = (yArea * xArea) / area;
          var idx = (ssy * srcW + ssx) * 4;
          r += (sD[idx]   / 255) * srcContribution;
          g += (sD[idx+1] / 255) * srcContribution;
          b += (sD[idx+2] / 255) * srcContribution;
          ssx += 1;
        }
        ssy += 1;
      }
      var idx = (y * w + x) * 4;
      dD[idx]   = r * 255;
      dD[idx+1] = g * 255;
      dD[idx+2] = b * 255;
      dD[idx+3] = 255;
      x += 1;
    }
    y += 1;
    reducePct = 0.6 + 0.4 * y / h;
    updateLoadPct();
  }

  dCtx.putImageData(destData,0,0);
  return destCan;
};

function onRenderClicked () {
  var pixels = max(16, min(MAX_RENDER_CANVAS_SIZE, (+pixelInput.value) || visCanvasSize));
  var useDownsample = downsampleCheckmark.checked;
  console.log("~~~");
  console.log("Starting new render:", pixels, useDownsample);

  FORCE_VISIBLE_CANVAS_SIZE = pixels;
  USE_DOWNSAMPLE = useDownsample;
  USE_RANDOM_HASH = false;

  window.removeEventListener('resize', resizeCallback, true);
  setRenderOptions();
  setSeed();
  rollRarity();
  startRender();
};
