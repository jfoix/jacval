//Imports
var gamejs = require('gamejs');
var box2d = require('./Box2dWeb-2.1.a.3_jf');
var vectors = require('gamejs/utils/vectors');
var math = require('gamejs/utils/math');

//Vars Size
var PLAYER_SIZE=1.2;
var BALL_SIZE=0.8;

//Vars Values
var WIDTH_PX=1100;
var HEIGHT_PX=500;
var SCALE=15;
var FORCE=20;
var FORCE_HIT=30;
var WIDTH_M=WIDTH_PX/SCALE;
var HEIGHT_M=HEIGHT_PX/SCALE;
var KEYS_DOWN={};
var b2world;

//Vars Categories
var CATEGORY_STAGE_WALL = 1;
var CATEGORY_STADUIM_WALL = 2;
var CATEGORY_PLAYER = 4;
var CATEGORY_BALL = 8;
var CATEGORY_GOAL_CIRCLE = 16;

var leftGoals = 0;
var rightGoals = 0;

//Vars Fonts
var font=new gamejs.font.Font('16px Sans-serif');

//Vars Key Bindings
var BINDINGS={up:gamejs.event.K_UP, 
              down:gamejs.event.K_DOWN,      
              left:gamejs.event.K_LEFT, 
              right:gamejs.event.K_RIGHT,
			  hold:gamejs.event.K_z,
			  x:gamejs.event.K_x}; 

var collisionListener = new box2d.b2ContactListener();

collisionListener.BeginContact = function (contact) {
   if (contact.GetFixtureA().GetBody().GetUserData() == 'player' && contact.GetFixtureB().GetBody().GetUserData() == 'ball') {
	   contact.GetFixtureA().GetBody().contactWithBall = true;
   } else if (contact.GetFixtureA().GetBody().GetUserData() == 'ball' && contact.GetFixtureB().GetBody().GetUserData() == 'player') {
	   contact.GetFixtureB().GetBody().contactWithBall = true;
   }
};

collisionListener.EndContact = function (contact) {
   if (contact.GetFixtureA().GetBody().GetUserData() == 'player') {
	   contact.GetFixtureA().GetBody().contactWithBall = false;
   } else if (contact.GetFixtureB().GetBody().GetUserData() == 'player') {
	   contact.GetFixtureB().GetBody().contactWithBall = false;
   }
};

var CircleGoal = function(pars){

    var bdef=new box2d.b2BodyDef();
    bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
	
    this.body=b2world.CreateBody(bdef);

    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(BALL_SIZE / 2);
    fixdef.restitution=0.6;
	fixdef.density=100;
	fixdef.friction=0;
	fixdef.filter.categoryBits = CATEGORY_GOAL_CIRCLE;
	fixdef.filter.maskBits = CATEGORY_BALL | CATEGORY_PLAYER;
    
	this.body.CreateFixture(fixdef);
	
    return this;  
};

var BoxProp = function(pars){

    this.size=pars.size;
    
    var bdef=new box2d.b2BodyDef();
    bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
    bdef.angle=0;
    bdef.fixedRotation=true;
	
    this.body=b2world.CreateBody(bdef);
    
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2PolygonShape();
    fixdef.shape.SetAsBox(this.size[0]/2, this.size[1]/2);
	fixdef.density=10;
	fixdef.friction=0;
	
	if(pars.type == 'external'){
		fixdef.restitution=0.1;
		fixdef.filter.categoryBits = CATEGORY_STAGE_WALL;
		fixdef.filter.maskBits = CATEGORY_PLAYER;
	} else {
		if(pars.type == 'goal'){
			fixdef.restitution=0;
		} else {
			fixdef.restitution=0.7;
		}
		
		fixdef.filter.categoryBits = CATEGORY_STADUIM_WALL;
		fixdef.filter.maskBits = CATEGORY_BALL;
	}
	
    this.body.CreateFixture(fixdef);
	
    return this;  
};

var CirclePlayer = function(pars){

    this.size=PLAYER_SIZE;
 
    var bdef=new box2d.b2BodyDef();
    bdef.type = box2d.b2Body.b2_dynamicBody;
	bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
    bdef.angle=0;
	bdef.linearDamping = 2.5;
    bdef.bullet=true;
    bdef.fixedRotation=true;
	
    this.body = b2world.CreateBody(bdef);
	this.body.SetUserData('player');
	this.body.contactWithBall = false;
    
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(PLAYER_SIZE);
    fixdef.restitution=0;
	fixdef.density=0.2;
	fixdef.friction=0.4;
	fixdef.filter.categoryBits = CATEGORY_PLAYER;
	fixdef.filter.maskBits = CATEGORY_BALL | CATEGORY_PLAYER | CATEGORY_STAGE_WALL | CATEGORY_GOAL_CIRCLE;
    
	this.body.CreateFixture(fixdef);
    
	return this;  
};

var CircleBall = function(pars){

    this.size = BALL_SIZE;
	this.position = pars.position;
    
    var bdef=new box2d.b2BodyDef();
	bdef.type = box2d.b2Body.b2_dynamicBody;
    bdef.position=new box2d.b2Vec2(pars.position[0], pars.position[1]);
	bdef.linearDamping=0.81;
    bdef.angle=0;
    bdef.bullet=true;
    bdef.fixedRotation=true;
	
    this.body=b2world.CreateBody(bdef);
    this.body.SetUserData('ball');

    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(BALL_SIZE);
    fixdef.restitution=0.1;
	fixdef.density=1;
	fixdef.friction=0.1;
	fixdef.filter.categoryBits = CATEGORY_BALL;
	fixdef.filter.maskBits = CATEGORY_STADUIM_WALL | CATEGORY_PLAYER | CATEGORY_GOAL_CIRCLE;
    
	this.body.CreateFixture(fixdef);
	
    return this;  
};

function main(){
   
    var display = gamejs.display.setMode([WIDTH_PX, HEIGHT_PX]);

    b2world=new box2d.b2World(new box2d.b2Vec2(0, 0), false);
	
	b2world.SetContactListener(collisionListener);
    
    var debugDraw = new box2d.b2DebugDraw();
    debugDraw.SetSprite(display._canvas.getContext("2d"));
    debugDraw.SetDrawScale(SCALE);
    debugDraw.SetFillAlpha(1);
    debugDraw.SetLineThickness(2.0);
    debugDraw.SetFlags(box2d.b2DebugDraw.e_shapeBit);
    b2world.SetDebugDraw(debugDraw);
    
	var center=[WIDTH_M/2, HEIGHT_M/2];
	
    new BoxProp({'size':[WIDTH_M, 0.1],	'position':[WIDTH_M/2, 0.1], 'type': 'external'});
    new BoxProp({'size':[0.1, HEIGHT_M],	'position':[0.1, HEIGHT_M/2], 'type': 'external'});
    new BoxProp({'size':[WIDTH_M, 0.1],	'position':[WIDTH_M/2, HEIGHT_M-0.1], 'type': 'external'});
    new BoxProp({'size':[0.1, HEIGHT_M], 'position':[WIDTH_M-0.1, HEIGHT_M/2], 'type': 'external'});
	
	var leftMargin = PLAYER_SIZE * 4;
	var rightMargin = WIDTH_M - (PLAYER_SIZE * 4);
	
	//TOP
	new BoxProp({'size':[WIDTH_M - (PLAYER_SIZE * 8), 0.1], 'position':[WIDTH_M/2, PLAYER_SIZE * 2], 'type': 'stadium'});
	//BOTTOM
    new BoxProp({'size':[WIDTH_M - (PLAYER_SIZE * 8), 0.1], 'position':[WIDTH_M/2, HEIGHT_M - PLAYER_SIZE * 2], 'type': 'stadium'});
	//LEFT TOP
    new BoxProp({'size':[0.1, (HEIGHT_M - (PLAYER_SIZE * 4)) / 3], 'position':[leftMargin, (HEIGHT_M / 4) - (PLAYER_SIZE)], 'type': 'stadium'});
	//LEFT BOTTOM
    new BoxProp({'size':[0.1, (HEIGHT_M - (PLAYER_SIZE * 4)) / 3], 'position':[leftMargin, (HEIGHT_M) - (PLAYER_SIZE * 6)], 'type': 'stadium'});
	//RIGHT TOP 
    new BoxProp({'size':[0.1, (HEIGHT_M - (PLAYER_SIZE * 4)) / 3], 'position':[rightMargin, (HEIGHT_M / 4) - (PLAYER_SIZE)], 'type': 'stadium'});
	//RIGHT TOP 
    new BoxProp({'size':[0.1, (HEIGHT_M - (PLAYER_SIZE * 4)) / 3], 'position':[rightMargin, (HEIGHT_M) - (PLAYER_SIZE * 6)], 'type': 'stadium'});
    
	//GOAL LEFT
	new BoxProp({'size':[BALL_SIZE * 4, 0.1], 'position':[(PLAYER_SIZE * 4) - (BALL_SIZE * 2) , ((HEIGHT_M - (PLAYER_SIZE)) / 3) + PLAYER_SIZE], 'type': 'goal'});
	new BoxProp({'size':[BALL_SIZE * 4, 0.1], 'position':[(PLAYER_SIZE * 4) - (BALL_SIZE * 2) , (HEIGHT_M / 2) + (PLAYER_SIZE * 4)], 'type': 'goal'});
	new BoxProp({'size':[0.1, (PLAYER_SIZE * 8)], 'position':[(PLAYER_SIZE * 4) - (BALL_SIZE * 4), center[1]], 'type': 'goal'});
	
	//GOAL RIGHT
	new BoxProp({'size':[BALL_SIZE * 4, 0.1], 'position':[(WIDTH_M - (PLAYER_SIZE * 4)) + (BALL_SIZE * 2) , ((HEIGHT_M - (PLAYER_SIZE)) / 3) + PLAYER_SIZE], 'type': 'goal'});
	new BoxProp({'size':[BALL_SIZE * 4, 0.1], 'position':[(WIDTH_M - (PLAYER_SIZE * 4)) + (BALL_SIZE * 2) , (HEIGHT_M / 2) + (PLAYER_SIZE * 4)], 'type': 'goal'});
	new BoxProp({'size':[0.1, (PLAYER_SIZE * 8)], 'position':[(WIDTH_M - (PLAYER_SIZE * 4)) + (BALL_SIZE * 4), center[1]], 'type': 'goal'});
	
	new CircleGoal({'position': [PLAYER_SIZE * 4, ((HEIGHT_M - (PLAYER_SIZE)) / 3) + PLAYER_SIZE]});
	new CircleGoal({'position': [PLAYER_SIZE * 4, (HEIGHT_M / 2) + (PLAYER_SIZE * 4)]});
	
	new CircleGoal({'position': [WIDTH_M - (PLAYER_SIZE * 4), ((HEIGHT_M - (PLAYER_SIZE)) / 3) + PLAYER_SIZE]});
	new CircleGoal({'position': [WIDTH_M - (PLAYER_SIZE * 4), (HEIGHT_M / 2) + (PLAYER_SIZE * 4)]});
	
	var players = [];
	var player1 = new CirclePlayer({'size':[1, 6], 'position':[center[0], center[1] + 10]});
	players.push(player1);
	
	var circleBall = new CircleBall({'size':[1, 6], 'position':[center[0], center[1]]});
	var stage = gamejs.image.load('images/cancha.png');
	var unit = gamejs.image.load('images/ball.png');
	var player = gamejs.image.load('images/player.png');
	
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
		
		if(KEYS_DOWN[BINDINGS.x] && player1.body.contactWithBall == true){
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
			circleBall.body.ApplyImpulse(circleBall.body.GetWorldVector(new box2d.b2Vec2(forceX, forceY)), ballPosition);
		}
		
        //update physics world
        b2world.Step(msDuration/1000, 10, 8);        
        
        //clear applied forces, so they don't stack from each update
        b2world.ClearForces();
        
        //fill background
        display.clear();
		gamejs.draw.rect(display, '#3D7030', new gamejs.Rect([0, 0], [WIDTH_PX, HEIGHT_PX]),0)
        b2world.DrawDebugData();
		
		display.blit(font.render('FPS: '+ parseInt((1000)/msDuration)), [25, 25]);
		
		display.blit(stage, [0,0]);
		/*
		
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

gamejs.preload(["images/cancha.png","images/ball.png","images/player.png"]);
gamejs.ready(main);
