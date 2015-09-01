var gamejs = require('gamejs');
var box2d = require('./Box2dWeb-2.1.a.3');
var vectors = require('gamejs/utils/vectors');
var math = require('gamejs/utils/math');

var PLAYER_SIZE=1.5;
var BALL_SIZE=1;

var WIDTH_PX=900;   //screen width in pixels
var HEIGHT_PX=500; //screen height in pixels
var SCALE=15;      //how many pixels in a meter
var WIDTH_M=WIDTH_PX/SCALE; //world width in meters. for this example, world is as large as the screen
var HEIGHT_M=HEIGHT_PX/SCALE; //world height in meters
var KEYS_DOWN={}; //keep track of what keys are held down by the player
var b2world;

//initialize font to draw text with
var font=new gamejs.font.Font('16px Sans-serif');

//key bindings
var BINDINGS={up:gamejs.event.K_UP, 
              down:gamejs.event.K_DOWN,      
              left:gamejs.event.K_LEFT, 
               right:gamejs.event.K_RIGHT}; 


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
    fixdef.restitution=0.4; //positively bouncy!
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
    bdef.fixedRotation=true;
	
    this.body=b2world.CreateBody(bdef);
    
    //initialize shape
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(PLAYER_SIZE); //size
    fixdef.restitution=0.4; //positively bouncy!
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
    bdef.fixedRotation=true;
	
    this.body=b2world.CreateBody(bdef);
    
    //initialize shape
    var fixdef=new box2d.b2FixtureDef;
    fixdef.shape=new box2d.b2CircleShape(BALL_SIZE); //size
    fixdef.restitution=0.4; //positively bouncy!
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
    debugDraw.SetFillAlpha(0.8);
    debugDraw.SetLineThickness(2.0);
    debugDraw.SetFlags(box2d.b2DebugDraw.e_shapeBit);
    b2world.SetDebugDraw(debugDraw);
    
    //initialize some props to bounce against
    var props=[];
    
    //outer walls
	
    props.push(new BoxProp({'size':[WIDTH_M, 0.1],    'position':[WIDTH_M/2, 0.1]}));
    props.push(new BoxProp({'size':[0.1, HEIGHT_M-2], 'position':[0.1, HEIGHT_M/2]}));
    props.push(new BoxProp({'size':[WIDTH_M, 0.1],    'position':[WIDTH_M/2, HEIGHT_M-0.1]}));
    props.push(new BoxProp({'size':[0.1, HEIGHT_M-2], 'position':[WIDTH_M-0.1, HEIGHT_M/2]}));
    
    //pen in the center
    var center=[WIDTH_M/2, HEIGHT_M/2];
	
	//jfoix
	var players = [];
	var player1 = new CirclePlayer({'size':[1, 6], 'position':[center[0]-3, center[1]]});
	players.push(player1);
	players.push(new CirclePlayer({'size':[1, 6], 'position':[center[0]-3, center[1]-4]}));
	players.push(new CirclePlayer({'size':[1, 6], 'position':[center[0]-2, center[1]+7]}));
	
	players.push(new CirclePlayer({'size':[1, 6], 'position':[5, 5]}));
	
	var circleBall = new CircleBall({'size':[1, 6], 'position':[center[0]+4, center[1]+7]});
	var stage = gamejs.image.load('images/cancha.jpg');
	var unit = gamejs.image.load('images/ball.png');
	var player = gamejs.image.load('images/player.png');
	
	console.log(circleBall.body.GetPosition());
    
	function tick(msDuration) {
        //GAME LOOP
        
        //set car controls according to player input
        if(KEYS_DOWN[BINDINGS.up]){
			var position=player1.body.GetWorldCenter();
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(0, -20)), position );
        } else if(KEYS_DOWN[BINDINGS.down]){
			var position=player1.body.GetWorldCenter();
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(0, 20)), position );
		}
		
		if(KEYS_DOWN[BINDINGS.left]){
			var position=player1.body.GetWorldCenter();
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(-20, 0)), position );
        } else if(KEYS_DOWN[BINDINGS.right]){
			var position=player1.body.GetWorldCenter();
            player1.body.ApplyForce(player1.body.GetWorldVector(new box2d.b2Vec2(20, 0)), position );
		}
		
        //update physics world
        b2world.Step(msDuration/1000, 10, 8);        
        
        //clear applied forces, so they don't stack from each update
        b2world.ClearForces();
        
        //fill background
        display.clear();
		display.blit(stage, [0, 0]);
        //b2world.DrawDebugData();
		display.blit(unit, [((circleBall.body.GetPosition().x - circleBall.size) * SCALE), (circleBall.body.GetPosition().y - circleBall.size) * SCALE]);
		
		for(var i = 0; i < players.length; i++){
			display.blit(player, [((players[i].body.GetPosition().x - players[i].size) * SCALE), (players[i].body.GetPosition().y - players[i].size) * SCALE]);
		}
        
		
		return;
    };
    function handleEvent(event){
        if (event.type === gamejs.event.KEY_DOWN) KEYS_DOWN[event.key] = true;
        else if (event.type === gamejs.event.KEY_UP) KEYS_DOWN[event.key] = false;  
    };
    gamejs.onTick(tick, this);
    gamejs.onEvent(handleEvent);
    
}

gamejs.preload(["images/cancha.jpg","images/ball.png","images/player.png"]);
gamejs.ready(main);
