from db import SessionLocal, Fighter

session = SessionLocal()

topuria = session.query(Fighter).filter(Fighter.name == "Ilia Topuria").first()
ngannou = session.query(Fighter).filter(Fighter.name == "Francis Ngannou").first()
jones = session.query(Fighter).filter(Fighter.name == "Jon Jones").first()

print("Topuria:", vars(topuria))
print("Ngannou:", vars(ngannou))
print("Jones:", vars(jones))

session.close()
