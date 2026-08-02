/**
 * Generate URL-friendly slug from text
 * @param text - Text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate player slug from first and last name
 * @param firstName - Player's first name
 * @param lastName - Player's last name
 * @returns Slug in format first-last
 */
export function generatePlayerSlug(firstName: string, lastName: string): string {
  return `${slugify(firstName)}-${slugify(lastName)}`;
}

const SITE_URL = 'https://starsnatwalker.com';

/**
 * Generate structured data (JSON-LD) for athlete.
 *
 * We are competing for each player's own name against NCSA, SportsRecruits,
 * PerfectGame and MaxPreps — all structured athlete databases. A bare
 * name+jobTitle Person loses to them by default. Everything the player record
 * actually knows goes into the entity: school, height, awards, IDs, socials.
 *
 * Fields are emitted only when present — never fabricate a measurement.
 */
export function generateAthleteStructuredData(player: any) {
  const fullName = `${player.firstName} ${player.lastName}`;
  const slug = generatePlayerSlug(player.firstName, player.lastName);
  const url = `${SITE_URL}/players/${slug}/`;

  // Height: schema.org wants a QuantitativeValue, not a display string.
  const height = player.heightInches
    ? {
        '@type': 'QuantitativeValue',
        value: player.heightInches,
        unitCode: 'INH',
        description: `${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"`,
      }
    : null;

  const sameAs = [
    player.twitter && `https://x.com/${player.twitter}`,
    player.milesplitUrl,
  ].filter(Boolean);

  // Position, bats/throws and measurables are what a recruiter actually
  // filters on — expose them as machine-readable properties.
  const positions = [player.position, ...(player.secondaryPositions || [])]
    .filter(Boolean)
    .join(' / ');

  const m = player.measurables || {};
  const measurableProps = [
    ['Exit Velocity', m.exitVelo, 'mph'],
    ['Outfield Velocity', m.outfieldVelo, 'mph'],
    ['Infield Velocity', m.infieldVelo, 'mph'],
    ['Pitch Speed', m.pitchSpeed, 'mph'],
    ['Pop Time', m.popTime, 'seconds'],
    ['60 Yard Dash', m.sixtyYard, 'seconds'],
  ]
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([name, value, unit]) => ({
      '@type': 'PropertyValue',
      name,
      value,
      unitText: unit,
    }));

  const additionalProperty = [
    { '@type': 'PropertyValue', name: 'Graduation Year', value: player.gradYear },
    positions && { '@type': 'PropertyValue', name: 'Position', value: positions },
    player.bats && { '@type': 'PropertyValue', name: 'Bats', value: player.bats },
    player.throws && { '@type': 'PropertyValue', name: 'Throws', value: player.throws },
    player.ncaaId && {
      '@type': 'PropertyValue',
      name: 'NCAA Eligibility Center ID',
      value: player.ncaaId,
    },
    player.recruitingStatus && {
      '@type': 'PropertyValue',
      name: 'Recruiting Status',
      value: player.recruitingStatus,
    },
    ...measurableProps,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    name: fullName,
    givenName: player.firstName,
    familyName: player.lastName,
    url,
    mainEntityOfPage: url,
    jobTitle: 'Softball Athlete',
    gender: 'Female',
    nationality: 'US',
    memberOf: {
      '@type': 'SportsTeam',
      name: 'Stars National Walker',
      sport: 'Softball',
      url: SITE_URL,
    },
    ...(player.bio && { description: player.bio }),
    ...(player.photoUrl && { image: player.photoUrl }),
    ...(height && { height }),
    ...(player.weightLbs && {
      weight: {
        '@type': 'QuantitativeValue',
        value: player.weightLbs,
        unitCode: 'LBR',
      },
    }),
    ...(player.highSchool && {
      alumniOf: {
        '@type': 'HighSchool',
        name: player.highSchool,
        ...(player.highSchoolState && {
          address: {
            '@type': 'PostalAddress',
            addressRegion: player.highSchoolState,
            addressCountry: 'US',
          },
        }),
      },
    }),
    ...(player.highSchoolState && {
      homeLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressRegion: player.highSchoolState,
          addressCountry: 'US',
        },
      },
    }),
    ...(player.achievements?.length && { award: player.achievements }),
    ...(player.intendedMajor && { knowsAbout: player.intendedMajor }),
    ...(sameAs.length && { sameAs }),
    ...(additionalProperty.length && { additionalProperty }),
  };
}

/**
 * Breadcrumb JSON-LD — gives Google the site hierarchy and earns the
 * breadcrumb treatment in the SERP instead of a bare URL.
 */
export function generateBreadcrumbData(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Per-player FAQ + FAQPage JSON-LD.
 *
 * Answer-engine play: these are the exact question forms a coach or parent
 * types ("what position does X play", "when does X graduate"). Each answer is
 * self-contained so an AI engine can lift it without the surrounding page.
 * Only questions the data can actually answer are emitted.
 */
export function generatePlayerFaqs(player: any) {
  const name = `${player.firstName} ${player.lastName}`;
  const positions = [player.position, ...(player.secondaryPositions || [])]
    .filter(Boolean)
    .join(' / ');
  const height = player.heightInches
    ? `${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"`
    : null;

  const faqs: { question: string; answer: string }[] = [];

  if (positions) {
    faqs.push({
      question: `What position does ${name} play?`,
      answer: `${name} plays ${positions} for Stars National Walker, a national travel softball program based in Charlotte, NC. She bats ${player.bats || 'R'} and throws ${player.throws || 'R'}.`,
    });
  }

  faqs.push({
    question: `What year does ${name} graduate?`,
    answer: `${name} is a member of the class of ${player.gradYear}${
      player.highSchool ? ` at ${player.highSchool}` : ''
    }${player.highSchoolState ? ` in ${player.highSchoolState}` : ''}.`,
  });

  if (player.gpa) {
    faqs.push({
      question: `What is ${name}'s GPA?`,
      answer: `${name} carries a ${player.gpa} GPA${
        player.highSchool ? ` at ${player.highSchool}` : ''
      }${player.intendedMajor ? `, and intends to study ${player.intendedMajor}` : ''}.`,
    });
  }

  if (player.ncaaId) {
    faqs.push({
      question: `Is ${name} NCAA registered?`,
      answer: `Yes. ${name} is registered with the NCAA Eligibility Center under ID ${player.ncaaId}.`,
    });
  }

  faqs.push({
    question: `How do college coaches contact ${name}?`,
    answer: `College coaches can reach ${name} through the Stars National Walker recruiting coordinator using the coach inquiry form at ${SITE_URL}/recruiting/. Video, transcripts, and tournament schedule are available on request.`,
  });

  if (player.recruitingStatus === 'uncommitted') {
    faqs.push({
      question: `Is ${name} still uncommitted?`,
      answer: `Yes. As of the ${player.gradYear} recruiting class, ${name} is uncommitted and actively being recruited.`,
    });
  } else if (player.committedTo) {
    faqs.push({
      question: `Where is ${name} committed?`,
      answer: `${name} is committed to ${player.committedTo}.`,
    });
  }

  return faqs;
}

export function generateFaqStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
