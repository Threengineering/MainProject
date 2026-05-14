from fastapi import APIRouter
import holidays

router = APIRouter()

@router.get("/")
def get_holidays(year: int, month: int = None):
    kr_holidays = holidays.KR(years=year)
    result = []
    
    for date, name in sorted(kr_holidays.items()):
        if month is None or date.month == month:
            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "name": name
            })
            
    return {"holidays": result}
