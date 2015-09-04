var gamejs = require('gamejs');
var box2d = require('./Box2dWeb-2.1.a.3');
var vectors = require('gamejs/utils/vectors');
var math = require('gamejs/utils/math');

var PLAYER_SIZE=1.2;
var BALL_SIZE=0.8;

var WIDTH_PX=900;   //screen width in pixels
var HEIGHT_PX=500; //screen height in pixels
var SCALE=15;      //how many pixels in a meter
var FORCE=20;      //how many force apply to move
var FORCE_HIT=500;      //how many force apply to move
var WIDTH_M=WIDTH_PX/SCALE; //world width in meters. for this example, world is as large as the screen
var HEIGHT_M=HEIGHT_PX/SCALE; //world height in meters
var KEYS_DOWN={}; //keep track of what keys are held down by the player
var b2world;
var CATEGORY_STAGE_WALL = 1;
var CATEGORY_STADUIM_WALL = 2;
var CATEGORY_PLAYER = 4;
var CATEGORY_BALL = 8;

//initialize font to draw text with
var font=new gamejs.font.Font('16px Sans-serif');

//key bindings
var BINDINGS={up:gamejs.event.K_UP, 
              down:gamejs.event.K_DOWN,      
              left:gamejs.event.K_LEFT, 
              right:gamejs.event.K_RIGHT,
			  hold:gamejs.event.K_z,
			  x:gamejs.event.K_x}; 


var BoxProp = function(pars){

    this.size=pars.size;
    
    //initialize body
    var bdef=new box2d.b2BodyDef();
    bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
    bdef.angle=0;
    bdef.fixedRotation=true;
    this.body=b2world.CreateBody(bdef);
    
    //initialize shape
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2PolygonShape();
    fixdef.shape.SetAsBox(this.size[0]/2, this.size[1]/2);
    fixdef.restitution=0.5;
	
	if(pars.external){
		fixdef.filter.categoryBits = CATEGORY_STAGE_WALL;
		fixdef.filter.maskBits = CATEGORY_PLAYER;
	} else {
		fixdef.filter.categoryBits = CATEGORY_STADUIM_WALL;
		fixdef.filter.maskBits = CATEGORY_BALL;
	}
    this.body.CreateFixture(fixdef);
    return this;  
};

var CirclePlayer = function(pars){

    this.size=PLAYER_SIZE;
 
    //initialize body
    var bdef=new box2d.b2BodyDef();
    bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
    bdef.angle=0;
	bdef.type = box2d.b2Body.b2_dynamicBody;
	bdef.linearDamping = 1;
    bdef.bullet=true;
    bdef.fixedRotation=true;
	
    this.body=b2world.CreateBody(bdef);
    
    //initialize shape
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(PLAYER_SIZE);
    fixdef.restitution=0;
	fixdef.density=0.2;
	fixdef.friction=0.6;
	fixdef.filter.categoryBits = CATEGORY_PLAYER;
	fixdef.filter.maskBits = CATEGORY_BALL | CATEGORY_PLAYER | CATEGORY_STAGE_WALL;
    this.body.CreateFixture(fixdef);
    return this;  
};

var CircleBall = function(pars){

    this.size = BALL_SIZE;
	this.position = pars.position;
    
    //initialize body
    var bdef=new box2d.b2BodyDef();
    bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
    bdef.angle=0;
	bdef.type = box2d.b2Body.b2_dynamicBody;
	bdef.linearDamping=0.4;
    bdef.bullet=true;
    bdef.fixedRotation=true;
	
    this.body=b2world.CreateBody(bdef);
    
    //initialize shape
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(BALL_SIZE);
    fixdef.restitution=0.5;
	fixdef.density=1;
	fixdef.friction=1;
	fixdef.filter.categoryBits = CATEGORY_BALL;
	fixdef.filter.maskBits = CATEGORY_STADUIM_WALL | CATEGORY_PLAYER;
    this.body.CreateFixture(fixdef);
    return this;  
};
/*
 *initialize car and props, start game loop
 */
function main(){
   
    //initialize display
    var display = gamejs.display.setMode([WIDTH_PX, HEIGHT_PX]);
    //display.scale(SCALE);
    //SET UP B2WORLD
    b2world=new box2d.b2World(new box2d.b2Vec2(0, 0), false);
    
    //set up box2d debug draw to draw the bodies for us.
    //in a real game, car will propably be drawn as a sprite rotated by the car's angle
    var debugDraw = new box2d.b2DebugDraw();
    debugDraw.SetSprite(display._canvas.getContext("2d"));
    debugDraw.SetDrawScale(SCALE);
    debugDraw.SetFillAlpha(1);
    debugDraw.SetLineThickness(2.0);
    debugDraw.SetFlags(box2d.b2DebugDraw.e_shapeBit);
    b2world.SetDebugDraw(debugDraw);
    
    //initialize some props to bounce against
    var props=[];
    
    //outer walls
	
    props.push(new BoxProp({'size':[WIDTH_M, 0.1],	'position':[WIDTH_M/2, 0.1], 			'external': true}));
    props.push(new BoxProp({'size':[0.1, HEIGHT_M],	'position':[0.1, HEIGHT_M/2], 			'external': true}));
    props.push(new BoxProp({'size':[WIDTH_M, 0.1],	'position':[WIDTH_M/2, HEIGHT_M-0.1], 	'external': true}));
    props.push(new BoxProp({'size':[0.1, HEIGHT_M], 'position':[WIDTH_M-0.1, HEIGHT_M/2], 	'external': true}));
	
	props.push(new BoxProp({'size':[WIDTH_M - PLAYER_SIZE * 4, 0.1],	'position':[WIDTH_M/2, PLAYER_SIZE * 2], 			'external': false}));
    props.push(new BoxProp({'size':[0.1, HEIGHT_M - PLAYER_SIZE * 4],	'position':[PLAYER_SIZE * 2, HEIGHT_M/2], 			'external': false}));
    props.push(new BoxProp({'size':[WIDTH_M - PLAYER_SIZE * 4, 0.1],    'position':[WIDTH_M/2, HEIGHT_M - PLAYER_SIZE * 2],	'external': false}));
    props.push(new BoxProp({'size':[0.1, HEIGHT_M - PLAYER_SIZE * 4], 	'position':[WIDTH_M - PLAYER_SIZE * 2, HEIGHT_M/2], 'external': false}));
    
    //pen in the center
    var center=[WIDTH_M/2, HEIGHT_M/2];
	
	//jfoix
	var players = [];
	var player1 = new CirclePlayer({'size':[1, 6], 'position':[center[0], center[1] + 10]});
	players.push(player1);
	
	//players.push(new CirclePlayer({'size':[1, 6], 'position':[center[0]-3, center[1]-4]}));
	//players.push(new CirclePlayer({'size':[1, 6], 'position':[center[0]-2, center[1]+7]}));
	
	//players.push(new CirclePlayer({'size':[1, 6], 'position':[5, 5]}));
	
	var circleBall = new CircleBall({'size':[1, 6], 'position':[center[0], center[1]]});
	var stage = gamejs.image.load('images/cancha5.jpg');
	var unit = gamejs.image.load('images/ball.png');
	var player = gamejs.image.load('images/playerld.png');
	
	console.log(circleBall.body.GetPosition());

    var absX = 0;
	var absY = 0;
	
	var diffX = 0;
	var diffY = 0;
	
	var forceX = 0;
	var forceY = 0;
	
	function tick(msDuration) {

		var curForce = KEYS_DOWN[BINDINGS.hold] ? FORCE - 18 : FORCE;
		var position = player1.body.GetWorldCenter();
		var ballPosition = circleBall.body.GetWorldCenter();
		
        if(KEYS_DOWN[BINDINGS.up]){
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(0, -curForce)), position);
        } else if(KEYS_DOWN[BINDINGS.down]){
			var position=player1.body.GetWorldCenter();
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(0, curForce)), position);
		}
		
		if(KEYS_DOWN[BINDINGS.left]){
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(-curForce, 0)), position);
        } else if(KEYS_DOWN[BINDINGS.right]){
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(curForce, 0)), position);
		}
		
		
				
		if(KEYS_DOWN[BINDINGS.x]){
			diffX = ballPosition.x - position.x;
			diffY = ballPosition.y - position.y;
			
			forceX = FORCE_HIT * (diffX < 0 ? -1 : 1);
			forceY = FORCE_HIT * (diffY < 0 ? -1 : 1);
			
			if(Math.abs(diffX) != Math.abs(diffY)){
				absX = Math.abs(diffX);
				absY = Math.abs(diffY);
				
				if(absX < absY){
					forceX = absY == 0 ? 0 : (absX / absY) * forceX;
				} else {
					forceY = absX == 0 ? 0 : (absY / absX) * forceY;
				}
			}
			circleBall.body.ApplyForce(circleBall.body.GetWorldVector(new box2d.b2Vec2(forceX, forceY)), ballPosition);
		}
		
        //update physics world
        b2world.Step(msDuration/1000, 10, 8);        
        
        //clear applied forces, so they don't stack from each update
        b2world.ClearForces();
        
        //fill background
        display.clear();
		
        b2world.DrawDebugData();
		/*
		display.blit(font.render('player: ' + logPosition(position)), [25, 25]);
		display.blit(font.render('ball  : ' + logPosition(ballPosition)), [25, 40]);
		display.blit(font.render('absX: ' + absX), [25, 55]);
		display.blit(font.render('absY: ' + absY), [25, 70]);
		display.blit(font.render('forceX: ' + forceX), [25, 85]);
		display.blit(font.render('forceY: ' + forceY), [25, 100]);
		display.blit(font.render('diffX: ' + diffX), [25, 115]);
		display.blit(font.render('diffY: ' + diffY), [25, 130]);
		*/
		/*
		gamejs.draw.rect(display, '#3D7030', new gamejs.Rect([0, 0], [WIDTH_PX, HEIGHT_PX]),0)
		display.blit(stage, [PLAYER_SIZE * 2 * SCALE, PLAYER_SIZE * 2 * SCALE]);
		display.blit(unit, [((circleBall.body.GetPosition().x - circleBall.size) * SCALE), (circleBall.body.GetPosition().y - circleBall.size) * SCALE]);
		
		for(var i = 0; i < players.length; i++){
			display.blit(player, [((players[i].body.GetPosition().x - players[i].size) * SCALE), (players[i].body.GetPosition().y - players[i].size) * SCALE]);
		}
		
		*/
		
		return;
    };
    function handleEvent(event){
        if (event.type === gamejs.event.KEY_DOWN) KEYS_DOWN[event.key] = true;
        else if (event.type === gamejs.event.KEY_UP) KEYS_DOWN[event.key] = false;  
    };
    gamejs.onTick(tick, this);
    gamejs.onEvent(handleEvent);
    
}

function logPosition(position){
	return "x: " + position.x + ", y: " + position.y;
}

gamejs.preload(["images/cancha5.jpg","images/ball.png","images/playerld.png"]);
gamejs.ready(main);
