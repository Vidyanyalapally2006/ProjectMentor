"""Generates 50+ curated projects spanning every domain in the spec.

Run standalone with `python -m app.seed_data` or it's invoked automatically
on API startup if the projects table is empty.
"""
import random

from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Project

random.seed(42)

DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]
DURATIONS = ["2-4 weeks", "1-2 months", "2-3 months", "4-6 months"]
TYPES = ["Mini", "Major", "Research", "Industry", "Hackathon"]

# domain -> (sub_domains, typical tech stack, typical skills)
DOMAIN_INFO = {
    "AI": (["Search & Planning", "Reinforcement Learning", "Expert Systems"], ["Python", "PyTorch", "OpenAI Gym"], {"Python": 4, "AI": 4}),
    "ML": (["Classification", "Regression", "Clustering"], ["Python", "scikit-learn", "Pandas"], {"Python": 3, "ML": 4}),
    "Deep Learning": (["CNNs", "RNNs", "Transformers", "GANs"], ["Python", "TensorFlow", "PyTorch"], {"Python": 4, "DL": 4}),
    "Data Science": (["EDA", "Time Series", "Statistical Modeling"], ["Python", "Pandas", "Matplotlib"], {"Python": 3, "Statistics": 3}),
    "Web Dev": (["Frontend", "Backend", "Full Stack"], ["React", "Node.js", "PostgreSQL"], {"JavaScript": 3, "React": 3}),
    "Mobile": (["Android", "iOS", "Cross-platform"], ["React Native", "Firebase"], {"JavaScript": 3, "Mobile": 3}),
    "Cybersecurity": (["Network Security", "Cryptography", "Pen Testing"], ["Python", "Wireshark", "Kali Linux"], {"Networking": 3, "Security": 4}),
    "Cloud": (["Serverless", "Containers", "Cloud-native"], ["AWS", "Docker", "Kubernetes"], {"Cloud": 3, "Linux": 3}),
    "DevOps": (["CI/CD", "Infrastructure as Code", "Monitoring"], ["Docker", "Jenkins", "Terraform"], {"Linux": 3, "DevOps": 3}),
    "Blockchain": (["Smart Contracts", "DeFi", "NFTs"], ["Solidity", "Ethereum", "Hardhat"], {"Solidity": 3, "Blockchain": 3}),
    "IoT": (["Embedded Systems", "Sensor Networks", "Edge Computing"], ["C++", "Raspberry Pi", "MQTT"], {"Embedded": 3, "C++": 3}),
    "AR/VR": (["Augmented Reality", "Virtual Reality", "Mixed Reality"], ["Unity", "C#", "ARKit"], {"Unity": 3, "3D Modeling": 2}),
    "Game Dev": (["2D Games", "3D Games", "Game AI"], ["Unity", "C#"], {"Unity": 3, "Game Design": 3}),
    "NLP": (["Sentiment Analysis", "Text Generation", "Machine Translation"], ["Python", "spaCy", "Hugging Face"], {"Python": 4, "NLP": 4}),
    "Computer Vision": (["Object Detection", "Image Segmentation", "CNNs"], ["Python", "OpenCV", "TensorFlow"], {"Python": 4, "Computer Vision": 4}),
}

INDUSTRIES = ["Healthcare", "E-commerce", "Education", "Finance", "Transportation", "Agriculture", "Entertainment", "Government"]

TITLE_TEMPLATES = [
    "{industry} {sub} Predictor",
    "{sub}-Based {industry} Analytics Dashboard",
    "Smart {industry} Assistant using {sub}",
    "{industry} {sub} Recommendation Engine",
    "Automated {industry} {sub} Pipeline",
]

SPECIAL_PROJECTS = [
    {
        "title": "AI Disease Prediction from Medical Images",
        "domain": "Deep Learning", "sub_domain": "CNNs", "industry": "Healthcare",
        "project_type": "Major", "difficulty": "Advanced", "duration": "4-6 months",
        "tech_stack": ["Python", "TensorFlow", "OpenCV", "Flask"],
        "skills_required": {"Python": 4, "TensorFlow": 3, "ML": 4, "DL": 3},
        "dataset_links": ["https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia"],
        "research_papers": ["https://arxiv.org/abs/2003.07369"],
        "description": (
            "Build a convolutional neural network that classifies chest X-ray images to flag "
            "signs of pneumonia and related conditions, then wrap it in a Flask API with a "
            "simple upload UI for clinicians to test images."
        ),
    },
]


def week_task(week, title, tasks, resources, deliverable):
    return {
        "week": week,
        "title": title,
        "tasks": tasks,
        "resources": resources,
        "deliverable": deliverable,
    }


def make_roadmap(duration: str, domain: str):
    weeks_count = {"2-4 weeks": 3, "1-2 months": 6, "2-3 months": 10, "4-6 months": 16}[duration]
    stages = [
        ("Research & Setup", ["Literature review", "Environment setup", "Define scope"]),
        ("Data Collection & Prep", ["Gather/clean data", "Exploratory analysis", "Feature engineering"]),
        ("Core Build", ["Implement core model/feature", "Unit test core logic", "Iterate on design"]),
        ("Integration", ["Connect components", "Build interface/API", "End-to-end testing"]),
        ("Evaluation", ["Benchmark performance", "Gather feedback", "Refine based on results"]),
        ("Polish & Ship", ["Write documentation", "Prepare demo/deployment", "Final presentation"]),
    ]
    weeks = []
    for i in range(1, weeks_count + 1):
        stage_title, stage_tasks = stages[min(i - 1, len(stages) - 1)]
        weeks.append(
            week_task(
                i,
                f"Week {i}: {stage_title}",
                [f"{t} ({domain})" for t in stage_tasks],
                ["Official docs", "Relevant tutorial/course", "Community forum thread"],
                f"{stage_title} artifact committed to repo",
            )
        )
    return {"weeks": weeks, "total_weeks": weeks_count}


def build_project(domain, industry, project_type, difficulty, duration, index):
    sub_domains, base_stack, base_skills = DOMAIN_INFO[domain]
    sub = random.choice(sub_domains)
    template = random.choice(TITLE_TEMPLATES)
    title = template.format(industry=industry, sub=sub)

    return dict(
        title=f"{title} #{index}",
        description=(
            f"A {difficulty.lower()}-level {project_type.lower()} project applying {domain} "
            f"({sub}) techniques to real problems in {industry}. Students build an end-to-end "
            f"solution: data/requirements gathering, core implementation, and a demoable interface."
        ),
        domain=domain,
        sub_domain=sub,
        industry=industry,
        project_type=project_type,
        difficulty=difficulty,
        duration=duration,
        tech_stack=base_stack,
        skills_required={k: min(5, v + random.choice([-1, 0, 1])) for k, v in base_skills.items()},
        dataset_links=[f"https://www.kaggle.com/search?q={sub.replace(' ', '+')}"],
        research_papers=[f"https://arxiv.org/search/?query={sub.replace(' ', '+')}"],
        roadmap=make_roadmap(duration, domain),
        why_recommended=(
            f"Strong match for students building {domain} skills with an interest in {industry}; "
            f"reinforces {sub} fundamentals with a portfolio-ready deliverable."
        ),
        prerequisites=[f"Basic {base_stack[0]}", f"Familiarity with {sub}"],
        learning_outcomes=[
            f"Hands-on experience with {sub}",
            f"Building and deploying a {domain} solution",
            "Working with real-world, messy data" if "Data" in domain or "ML" in domain or "Deep" in domain else "Structuring a full project lifecycle",
        ],
        career_benefits=[
            f"Portfolio piece for {industry} or {domain} roles",
            "Demonstrates end-to-end delivery, not just a tutorial clone",
        ],
        challenges="Balancing scope with the available timeline; sourcing clean, representative data.",
        solutions="Timebox research, start with a small working slice, then iterate outward.",
        images=[],
        is_curated=True,
    )


def generate_projects(n=60):
    projects = []
    domains = list(DOMAIN_INFO.keys())
    combo_index = 1
    while len(projects) < n:
        domain = domains[combo_index % len(domains)]
        industry = INDUSTRIES[combo_index % len(INDUSTRIES)]
        project_type = TYPES[combo_index % len(TYPES)]
        difficulty = DIFFICULTIES[combo_index % len(DIFFICULTIES)]
        duration = DURATIONS[combo_index % len(DURATIONS)]
        projects.append(build_project(domain, industry, project_type, difficulty, duration, combo_index))
        combo_index += 1
    return projects


def seed(db: Session):
    if db.query(Project).count() > 0:
        return  # already seeded

    for sp in SPECIAL_PROJECTS:
        sp = dict(sp)
        sp.setdefault("roadmap", make_roadmap(sp["duration"], sp["domain"]))
        sp.setdefault("prerequisites", ["Python fundamentals", "Basic ML concepts"])
        sp.setdefault("learning_outcomes", ["CNN architecture design", "Medical image preprocessing", "Model deployment via Flask"])
        sp.setdefault("career_benefits", ["Strong portfolio piece for health-tech / applied ML roles"])
        sp.setdefault("why_recommended", "A flagship applied deep-learning project with real clinical relevance.")
        sp.setdefault("challenges", "Class imbalance in medical datasets; avoiding overfitting on small samples.")
        sp.setdefault("solutions", "Use data augmentation, class weighting, and transfer learning from pretrained CNNs.")
        sp.setdefault("images", [])
        sp.setdefault("is_curated", True)
        db.add(Project(**sp))

    for p in generate_projects(60):
        db.add(Project(**p))

    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        print(f"Seeded projects. Total in DB: {db.query(Project).count()}")
    finally:
        db.close()
