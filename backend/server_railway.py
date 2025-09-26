from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'fantacalcio_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI(title="FantaCalcio League Management", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '696969')

def verify_admin_password(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password non valida",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

# Models
class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner: str
    logo_url: Optional[str] = None
    shirt_url: Optional[str] = None
    remaining_credits: int = Field(default=100)
    remaining_changes: int = Field(default=17)
    weekly_prizes: int = Field(default=0)
    total_winnings: int = Field(default=0)
    non_callable_players: str = Field(default="Nessun giocatore")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamCreate(BaseModel):
    name: str
    owner: str
    logo_url: Optional[str] = None
    shirt_url: Optional[str] = None
    remaining_credits: int = Field(default=100)
    remaining_changes: int = Field(default=17)
    weekly_prizes: int = Field(default=0)
    total_winnings: int = Field(default=0)
    non_callable_players: str = Field(default="Nessun giocatore")

class TeamUpdate(BaseModel):
    remaining_credits: Optional[int] = None
    remaining_changes: Optional[int] = None
    weekly_prizes: Optional[int] = None
    total_winnings: Optional[int] = None
    non_callable_players: Optional[str] = None

class AdminAuth(BaseModel):
    password: str

class LeagueStats(BaseModel):
    total_teams: int
    total_prizes: int
    total_winnings: int

# Public routes
@api_router.get("/")
async def root():
    return {"message": "FantaCalcio League API"}

@api_router.get("/teams", response_model=List[Team])
async def get_all_teams():
    """Get all teams - public endpoint"""
    teams = await db.teams.find().sort("total_winnings", -1).to_list(length=None)
    return [Team(**team) for team in teams]

@api_router.get("/teams/{team_id}", response_model=Team)
async def get_team(team_id: str):
    """Get single team by ID - public endpoint"""
    team = await db.teams.find_one({"id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Squadra non trovata")
    return Team(**team)

@api_router.get("/stats", response_model=LeagueStats)
async def get_league_stats():
    """Get league statistics - public endpoint"""
    teams = await db.teams.find().to_list(length=None)
    total_teams = len(teams)
    total_prizes = sum(team.get("weekly_prizes", 0) for team in teams)
    total_winnings = sum(team.get("total_winnings", 0) for team in teams)
    
    return LeagueStats(
        total_teams=total_teams,
        total_prizes=total_prizes,
        total_winnings=total_winnings
    )

@api_router.get("/leaderboard", response_model=List[Team])
async def get_leaderboard():
    """Get teams ordered by total winnings - public endpoint"""
    teams = await db.teams.find().sort("total_winnings", -1).to_list(length=None)
    return [Team(**team) for team in teams]

# Admin routes (require authentication)
@api_router.post("/admin/auth")
async def admin_login(auth: AdminAuth):
    """Admin authentication"""
    if auth.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Password non valida")
    return {"message": "Autenticazione riuscita", "token": ADMIN_PASSWORD}

@api_router.post("/admin/teams", response_model=Team)
async def create_team(team: TeamCreate, _: str = Depends(verify_admin_password)):
    """Create new team - admin only"""
    team_dict = team.dict()
    team_obj = Team(**team_dict)
    await db.teams.insert_one(team_obj.dict())
    return team_obj

@api_router.put("/admin/teams/{team_id}", response_model=Team)
async def update_team(team_id: str, updates: TeamUpdate, _: str = Depends(verify_admin_password)):
    """Update team - admin only"""
    # Find existing team
    existing_team = await db.teams.find_one({"id": team_id})
    if not existing_team:
        raise HTTPException(status_code=404, detail="Squadra non trovata")
    
    # Prepare update data
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update in database
    await db.teams.update_one({"id": team_id}, {"$set": update_data})
    
    # Return updated team
    updated_team = await db.teams.find_one({"id": team_id})
    return Team(**updated_team)

@api_router.delete("/admin/teams/{team_id}")
async def delete_team(team_id: str, _: str = Depends(verify_admin_password)):
    """Delete team - admin only"""
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Squadra non trovata")
    return {"message": "Squadra eliminata con successo"}

# Initialize teams on startup
@app.on_event("startup")
async def initialize_teams():
    """Initialize with the 10 teams from the reference site"""
    try:
        existing_teams = await db.teams.count_documents({})
        
        if existing_teams == 0:
            initial_teams = [
                TeamCreate(
                    name="AC CIUGHINA",
                    owner="John Jones & Pierpy",
                    remaining_credits=122,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="AC SPIDERMAN",
                    owner="Vanio",
                    remaining_credits=92,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="ASTON BIRR",
                    owner="CR7 QUARATO & Claudio",
                    remaining_credits=77,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="FC BISCIONE",
                    owner="Angetony & xxx",
                    remaining_credits=66,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="GOBBI FC",
                    owner="Ciccio",
                    remaining_credits=56,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="SILANO DOP",
                    owner="Vito V",
                    remaining_credits=32,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="SBALLATI FC",
                    owner="Alessio",
                    remaining_credits=135,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="DISGRAZIETI MALEDETTI",
                    owner="Piema",
                    remaining_credits=51,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                ),
                TeamCreate(
                    name="LOVEGANG126",
                    owner="marchiteo & chri",
                    remaining_credits=63,
                    remaining_changes=17,
                    weekly_prizes=1,
                    total_winnings=10
                ),
                TeamCreate(
                    name="MONEY",
                    owner="gigione & rich.campanella.89",
                    remaining_credits=72,
                    remaining_changes=17,
                    weekly_prizes=0,
                    total_winnings=0
                )
            ]
            
            for team_data in initial_teams:
                team_obj = Team(**team_data.dict())
                await db.teams.insert_one(team_obj.dict())
            
            logging.info("Initialized 10 teams in database")
    except Exception as e:
        logging.error(f"Database initialization error: {e}")

# Include the router in the main app
app.include_router(api_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # In produzione, specifica i domini
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files and React app
static_dir = Path(__file__).parent / "../frontend/build"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir / "static"), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # If path starts with /api, let FastAPI handle it
        if full_path.startswith("api"):
            raise HTTPException(status_code=404)
            
        # For all other paths, serve index.html (React app)
        return FileResponse(static_dir / "index.html")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
