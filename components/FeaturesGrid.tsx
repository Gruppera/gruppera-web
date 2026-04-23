import { Text, Title } from '@mantine/core';
import classes from './FeaturesGrid.module.css';

export function FeaturesGrid() {
  return (
    <div className={classes.wrapper}>
      <div className={classes.hero}>
        <div className={classes.titleBox}>
          <Title className={classes.title}>
            <span className={classes.titleText}>Rätt lösning på rätt plats</span>
          </Title>

          <Text size="sm" className={classes.description}>
            <span className={classes.descriptionText}>
              Vi på Gruppera hjälper ert team att leverera värde till era kunder och användare
            </span>
          </Text>
        </div>
      </div>
    </div>
  );
}
