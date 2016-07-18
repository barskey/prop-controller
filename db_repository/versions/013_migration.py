from sqlalchemy import *
from migrate import *


from migrate.changeset import schema
pre_meta = MetaData()
post_meta = MetaData()
trigger = Table('trigger', pre_meta,
    Column('id', INTEGER, primary_key=True, nullable=False),
    Column('controller_id', INTEGER),
    Column('triggertype_id', INTEGER),
    Column('name', VARCHAR(length=24)),
    Column('param1', VARCHAR(length=8)),
    Column('param2', VARCHAR(length=8)),
    Column('num', INTEGER),
)


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    pre_meta.tables['trigger'].columns['name'].drop()


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    pre_meta.tables['trigger'].columns['name'].create()
