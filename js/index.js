//3D display of tensegrities based on dance pairings
//incorporates parts of
//3D Generative Wireframes by Gary Homewood
//Spring Particle System by Alasdair Turner

//typical camera distance 7, 9, 12 for 1, 2, 3 pairs
//block demo used camera distance of 100 and x offsets of +- 200
//rotateY(this.x * -.0012) or sgn(-offset) * 0.24 rad
//scale tensegrity up about 10x

//each 1-residue is named by its missing color and the lowest vertex in it
//each 0-residue is named by the lowest vertex in it, the first being, of course, 0
//each vertex has a triplet: the lowest-numbered vertex in each of its three color residues
//the connected component (0-residue) is completely known when this table is full
//
//start at 0 vertex, follow the 0 residue, starting with the 0+1 edge, then 0+2 edge and test if at start, if not repeat
//then do the same for the 1 residue, starting with the 1+1 edge, then the 1+2 edge and test if at start
//then same for the 2 residue
//then go to the next lowest vertex named in those residues
//look for unfilled triplet, and complete
//continue until there is no named vertex with unfilled triplet, this completes component 0
//go to lowest unnamed vertex, this is the name of the second component
//repeat process
//component and residue exploration is done when completed component leave no unnamed vertices
//Euler characteristic follows from these (bicolored) face counts because counts of edges (2-residues) and vertices (3-residues) follow from numPairs. 
//Since graphs are bipartite we only need to keep track of girls, they will always be the lowest numbered vertices in a 1-residue
//So each girl vertex has a triplet which is the lowest numbered girl vertex in each of its three color residues
//And a fourth number, the lowest-numbered girl in its 0-residue.

//to locate pieces, there is an array of vec3 points as gravitational attractors
//every subvertex has a component number
//different components have different gravitational attractors

'use strict';

var sF = 300.0; //scaleFactor

var isPlaying = true;
var goldList = [];
var silverList = [];
var bronzeList = [];
var numCodes = 3;
var codeColors = new Array(numCodes);
var gravityPts = new Array(1);
var numPairs = 2;
var numDancers = 2 * numPairs;
var numSubvertices = numDancers * 3;
var numInteractions = numSubvertices * 2 + 3 * numPairs + numSubvertices; // 4/2 tendons per subvertex and 3 struts per girl + 1 gravity per subV
var interactionIndex = 0;
var dancerDB = new Array(numDancers);
var subvertexDB = new Array(numSubvertices);
var interactionDB = new Array(numInteractions);
var sA = 0.8;//startAmplitude
var dampingFactor = 0.86;
var forceFactor = 0.05;//was 0.15
var gravityFactor = 0.5;
var isNew = true;
var isJiggle = false;
var theCG;
var boyColor = "rgb(0,170,255)";
var girlColor = "rgb(255,80,200)";
var strutColor = "rgb(200,200,200)";
var tendonColor = "rgb(80,80,80)";
codeColors[0] = "rgb(255,223,0)";//gold
codeColors[1] = "rgb(210,210,210)";//silver
codeColors[2] = "rgb(220,130,30)";//bronze

togglePlay = document.getElementById('togglePlay');
togglePlay.onclick = function() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    togglePlay.innerHTML = 'stop';//display 'stop' button
  } else {
    togglePlay.innerHTML = 'start';//display 'start' button
  }
}

 
document.addEventListener("click", function(){
if (mouseY > 100) {
    isJiggle = true;
    }
});  


function setup() {

	
	gravityPts[0] = vec3.create(0.0, 0.0, 0.0);
	
  theCG = vec3.create(0.0, 0.0, 0.0);
  for (var i = 0; i < numPairs; i++) { //dance pairings are coded by permutations of the boys
    goldList.push(i);
    silverList.push(i);
    bronzeList.push(i);
  }
  goldList = shuffle(goldList);
  silverList = shuffle(silverList);
  bronzeList = shuffle(bronzeList);
  var c = createCanvas(windowWidth, windowHeight, WEBGL);
}//end setup

function draw() {
  if (isPlaying) {}
  background(0);
  
 
  var tempCG = vec3.createFrom(0.0, 0.0, 0.0);//we calculate a new cg for each frame
  
  if (isNew) {//initialize simulation on first frame of new arrangement
    initialize();
    isNew = false;
  }
  
  for (var i = 0; i < interactionIndex; i++)//update Particle velocities for every interaction
  {
    updateVel(subvertexDB, interactionDB[i].source, interactionDB[i].sink, interactionDB[i].isStrut, interactionDB[i].isGravity);
  }//end update Particle velocities for every interaction
  
  //keep track of x, y, z range of particle positions
  var updateCount = 0;
  var xMin = 1000000.0;
  var xMax = -1000000.0;
  var xWidth;
  var yMin = 1000000;
  var yMax = -1000000;
  var yWidth;
  var zMin = 1000000;
  var zMax = -1000000;
  var zWidth;
  var theWidth;
  
  for (var i = 0; i < subvertexDB.length; i++)
  { 
  	subvertexDB[i].theParticle.jiggle(sA/800.0);//add random noise to velocity
  }  
  
  
  
  if (isJiggle) {
  for (var i = 0; i < subvertexDB.length; i++)
  { 
  	subvertexDB[i].theParticle.jiggle(sA/5.0);//add extra random noise to velocity
  }  
  isJiggle = false;  
  }
  
  
  for (var i = 0; i < subvertexDB.length; i++)//update every particle position
  {
      subvertexDB[i].theParticle.damp();//damp velocity
      subvertexDB[i].theParticle.move();//update position
      if (subvertexDB[i].theParticle.pos[0] < xMin)//look for minimum x value
      {
        xMin = subvertexDB[i].theParticle.pos[0];
      }
      if (subvertexDB[i].theParticle.pos[1] < yMin)//look for minimum y value
      {
        yMin = subvertexDB[i].theParticle.pos[1];
      }
      if (subvertexDB[i].theParticle.pos[2] < zMin)//look for minimum z value
      {
        zMin = subvertexDB[i].theParticle.pos[2];
      }
      if (subvertexDB[i].theParticle.pos[0] > xMax)//look for maximum x value
      {
        xMax = subvertexDB[i].theParticle.pos[0];
      }
      if (subvertexDB[i].theParticle.pos[1] > yMax)//look for maximum y value
      {
        yMax = subvertexDB[i].theParticle.pos[1];
      }
      if (subvertexDB[i].theParticle.pos[2] > zMax)//look for maximum z value
      {
        zMax = subvertexDB[i].theParticle.pos[2];
      }

      vec3.add(tempCG, subvertexDB[i].theParticle.pos);//accumulate positions for center of gravity calculation
      updateCount+=1;//keep count of terms for later averaging
  }//end update every particle position
  
  xWidth = xMax - xMin;
  yWidth = yMax - yMin;
  zWidth = zMax - zMin;
  theWidth = (xWidth + yWidth + zWidth)/3.0;
  vec3.scale(tempCG, 1.0/updateCount);//calculate center of gravity
  vec3.scale(tempCG, 0.1);//weight for running average
  vec3.scale(theCG, 0.9);//weight for running average
  vec3.add(theCG, tempCG);
  
  translate(0, 0, -100) //move away from camera
 
for (var r = -1; r < 3; r+= 2)//for both views, i.e., r = -+1
  {
    push();
    translate(200.0*r, 0.0, 0.0);
    rotateY(-r * 0.24);
      for (var i = 0; i < interactionIndex; i++)//draw struts and tendons
      { 
        if (interactionDB[i].isStrut)
        {  
          stroke(codeColors[interactionDB[i].strutColor]);
          line(sF*subvertexDB[interactionDB[i].source].theParticle.pos[0], sF*subvertexDB[interactionDB[i].source].theParticle.pos[1], sF*subvertexDB[interactionDB[i].source].theParticle.pos[2], sF*subvertexDB[interactionDB[i].sink].theParticle.pos[0], sF*subvertexDB[interactionDB[i].sink].theParticle.pos[1], sF*subvertexDB[interactionDB[i].sink].theParticle.pos[2]);
        }
        else
        { 
          if(interactionDB[i].isTriangle)
          {
            if(interactionDB[i].isGirlTriangle)
            {
            stroke(girlColor);
            }
            else
            {
              stroke(boyColor);
            }
          }
          else
          {
          stroke(tendonColor);
          }         
          line(sF*subvertexDB[interactionDB[i].source].theParticle.pos[0], sF*subvertexDB[interactionDB[i].source].theParticle.pos[1], sF*subvertexDB[interactionDB[i].source].theParticle.pos[2], sF*subvertexDB[interactionDB[i].sink].theParticle.pos[0], sF*subvertexDB[interactionDB[i].sink].theParticle.pos[1], sF*subvertexDB[interactionDB[i].sink].theParticle.pos[2]);
        }
      }//end for draw struts and tendons 
    pop();
  }//end for both views
}//end draw

function Dancer() {
  this.partners = new Array(3);
}

function Subvertex() {
  this.theParticle = new Particle();
  this.componentNum = 0;
}

function Particle() {
  this.pos = vec3.createFrom(getRandomPlusMinus(sA),getRandomPlusMinus(sA), getRandomPlusMinus(sA));
  this.vel = vec3.createFrom(getRandomPlusMinus(sA/10.0), getRandomPlusMinus(sA/10.0), getRandomPlusMinus(sA/10.0));
}
Particle.prototype.move = function() {
  vec3.add(this.pos,this.vel);
}
Particle.prototype.jiggle = function(a) {
  vec3.add(this.vel, vec3.createFrom(getRandomPlusMinus(a), getRandomPlusMinus(a), getRandomPlusMinus(a)));
}
Particle.prototype.damp = function() {
  vec3.scale(this.vel, dampingFactor);
}

function Interaction() {
  this.source = 0;
  this.sink = 0;
  this.strutColor = 0;
  this.isStrut = false;
  this.isTriangle = false;
  this.isGirlTriangle = false;
  this.isGravity = false;
}

function updateVel(_theSubvertexDB, _source, _sink, _isStrut, _isGravity) {
  var diffVector = vec3.createFrom(0.0, 0.0, 0.0);
  if(_isGravity){//then _sink is read as componentNum 
  vec3.subtract(gravityPts[0], _theSubvertexDB[_source].theParticle.pos, diffVector);
  }
  else{
  vec3.subtract(_theSubvertexDB[_sink].theParticle.pos, _theSubvertexDB[_source].theParticle.pos, diffVector);
  }
  var dSquared = vec3.squaredLength(diffVector);  
  var force;// force, x, is positive for a tendon    
  if (_isStrut) {
    force = dSquared - 1.0;
  } else //is tendon
  {
    force = dSquared;
  }  
 if (_isGravity){ //weak gravity tendon and ignore force on sink
 vec3.scale(diffVector, force * forceFactor * gravityFactor);
  vec3.add(_theSubvertexDB[_source].theParticle.vel, diffVector);
 }
 else { 
  vec3.scale(diffVector, force * forceFactor);
  vec3.add(_theSubvertexDB[_source].theParticle.vel, diffVector);
  vec3.subtract(_theSubvertexDB[_sink].theParticle.vel, diffVector);
  }
} //end interact

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}//end shuffle

function Stack() {
  this.stac = new Array();
  this.pop = function() {
    return this.stac.pop();
  }
  this.push = function(item) {
    this.stac.push(item);
  }
}//end Stack

function calcCentroid(vecA, vecB, vecC) {
  var sum = vec3.createFrom(0, 0, 0);
  vec3.add(sum, vecA)
  vec3.add(sum, vecB)
  vec3.add(sum, vecC)
  vec3.scale(sum, 1.0 / 3);
  return sum;
}//end calcCentroid


function initialize()
{
  for (var i = 0; i< dancerDB.length; i+=1)
  {
    dancerDB[i] = new Dancer();
  }  
  for (var i = 0; i< subvertexDB.length; i+=1)
  {
    subvertexDB[i] = new Subvertex();
  }  
  for (var i = 0; i< interactionDB.length; i+=1)
  {
    interactionDB[i] = new Interaction();
  }
	for(var i = 0; i<numPairs; i+=1) //for all girls
		{   
			dancerDB[i].partners[0] = numPairs + goldList[i];
  			dancerDB[numPairs + goldList[i]].partners[0] = i;			
  			dancerDB[i].partners[1] = numPairs + silverList[i];
  			dancerDB[numPairs + silverList[i]].partners[1] = i; 			
  			dancerDB[i].partners[2] = numPairs + bronzeList[i];
  			dancerDB[numPairs + bronzeList[i]].partners[2] = i;				
		}
diamond();
}//end initialize


function diamond()
{
  //Diamond tensegrity pattern: every subvertex of a girl vertex is associated with a rectangle of tendons associated with the edge of its color  
  for (var i = 0; i< numPairs; i+=1)//for each girl dancer
  { 
    for(var j = 0; j < 3; j+=1) //for each subvertex
    {
      //each subvertex sources a triangle tendon to its mod 3 lower to mod3 higher neighbors (use +2 for the lower number)
        interactionDB[interactionIndex].source = 3*i + (j + 2)%3;//from lower neighbor
        interactionDB[interactionIndex].sink = 3*i + (j + 1)%3;//to higher neighbor
        interactionDB[interactionIndex].isTriangle = true;
        interactionDB[interactionIndex].isGirlTriangle = true;//tendon color is going to be pink
        interactionIndex += 1;
        
     //each subvertex is associated with the sources of a pair of tendons toward the dance partner of the same color
        interactionDB[interactionIndex].source = 3*i + (j + 1)%3;//tendon from higher color subvertex
        interactionDB[interactionIndex].sink = (dancerDB[i].partners[j]) * 3 + (j + 1)%3;//to partners subvertex of the same color
        interactionIndex += 1;
        
        interactionDB[interactionIndex].source = 3*i + (j + 2)%3;//tendon from lower color subvertex
        interactionDB[interactionIndex].sink = (dancerDB[i].partners[j]) * 3 + (j + 2)%3;//to partner's subvertex of same color
        interactionIndex += 1;
        
    //and a triangle tendon connecting the higher and lower neighbor of the boy's vertex of the same color
        interactionDB[interactionIndex].source = (dancerDB[i].partners[j]) * 3 + (j + 2)%3;//tendon from boy's lower subvertex
        interactionDB[interactionIndex].sink = (dancerDB[i].partners[j]) * 3 + (j + 1)%3;//to boy's higher subvertex
        interactionDB[interactionIndex].isTriangle = true;
        interactionDB[interactionIndex].isGirlTriangle = false;//tendon color is going to be blue
        interactionIndex += 1;     
      
      //each subvertex is associated with a chiral strut from its j+1 neighboring subvertex to the partner's j-1 subvertex
        interactionDB[interactionIndex].source = 3*i + (j + 1)%3;
        interactionDB[interactionIndex].sink = (dancerDB[i].partners[j]) * 3 + (j + 2)%3;
        interactionDB[interactionIndex].isStrut = true;
        interactionDB[interactionIndex].strutColor = j;
        interactionIndex += 1;
        
     //each subvertex is associated with a gravity tendon to its component's origin
        interactionDB[interactionIndex].source = 3*i + (j + 1)%3;
        interactionDB[interactionIndex].sink = 0;//sink will be read as componentNum
        interactionDB[interactionIndex].isGravity = true;
        interactionIndex += 1;
        
        
      }//end for each subvertex         
  }//end for each dancer
}

// Returns a random number between -v (inclusive) and v (exclusive)
function getRandomPlusMinus(v) {
  return Math.random() * (2*v) - v;
}

/**
 * code below abstracted from:
 * @fileoverview gl-matrix - High performance matrix and vector operations for WebGL
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 1.3.7
 */
var vec3 = {};
vec3.create = function(vec) {
  var dest = new Array(3);
  if (vec) {
    dest[0] = vec[0];
    dest[1] = vec[1];
    dest[2] = vec[2];
  } else {
    dest[0] = dest[1] = dest[2] = 0;
  }
  return dest;
};
vec3.createFrom = function(x, y, z) {
  var dest = new Array(3);
  dest[0] = x;
  dest[1] = y;
  dest[2] = z;
  return dest;
};
vec3.set = function(vec, dest) {
  dest[0] = vec[0];
  dest[1] = vec[1];
  dest[2] = vec[2];
  return dest;
};
vec3.add = function(vec, vec2, dest) {
  if (!dest || vec === dest) {
    vec[0] += vec2[0];
    vec[1] += vec2[1];
    vec[2] += vec2[2];
    return vec;
  }
  dest[0] = vec[0] + vec2[0];
  dest[1] = vec[1] + vec2[1];
  dest[2] = vec[2] + vec2[2];
  return dest;
};
vec3.subtract = function(vec, vec2, dest) {
  if (!dest || vec === dest) {
    vec[0] -= vec2[0];
    vec[1] -= vec2[1];
    vec[2] -= vec2[2];
    return vec;
  }
  dest[0] = vec[0] - vec2[0];
  dest[1] = vec[1] - vec2[1];
  dest[2] = vec[2] - vec2[2];
  return dest;
};
vec3.multiply = function(vec, vec2, dest) {
  if (!dest || vec === dest) {
    vec[0] *= vec2[0];
    vec[1] *= vec2[1];
    vec[2] *= vec2[2];
    return vec;
  }
  dest[0] = vec[0] * vec2[0];
  dest[1] = vec[1] * vec2[1];
  dest[2] = vec[2] * vec2[2];
  return dest;
};
vec3.scale = function(vec, val, dest) {
  if (!dest || vec === dest) {
    vec[0] *= val;
    vec[1] *= val;
    vec[2] *= val;
    return vec;
  }
  dest[0] = vec[0] * val;
  dest[1] = vec[1] * val;
  dest[2] = vec[2] * val;
  return dest;
};
vec3.squaredLength = function(vec) {
  var x = vec[0],
    y = vec[1],
    z = vec[2];
  return x * x + y * y + z * z;
};
